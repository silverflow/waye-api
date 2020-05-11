let app = require("express")();
let server = require("http").createServer(app);
// http server를 socket.io server로 upgrade한다
let io = require("socket.io")(server);
let secretObj = require("./config/jwt");
let socketioJwt = require("socketio-jwt");
let mysql = require("mysql");
let dbInfo = require("./config/mysql");
var FCM = require("fcm-node"),
	fcm = new FCM("");

let con = mysql.createConnection(dbInfo.secret);

let sMysql = require("sync-mysql");
var sCon = new sMysql(dbInfo.secret);

app.get("/", function (req, res) {
	res.sendFile(__dirname + "/index.html");
});
io.use(
	socketioJwt.authorize({
		secret: secretObj.secret,
		handshake: true,
	})
);

app.get("/push/:id", (req, res, next) => {
	console.log(req.params.id);
	var fcm_list = [];

	var now = new Date().toLocaleString("en-US", {
		timeZone: "Asia/Seoul",
	});
	con.query(
		"SELECT token FROM user_fcm WHERE user_id = ?",
		[req.params.id],
		function (err, result) {
			if (err) throw err;
			fcm_list = result;
			fcm_list.map((item2) => {
				// fcm 데이터 형성
				// title : 누구님에게 메시지가 도착했습니다
				// body : 메시지 내용
				// sender : sender_id
				// type : msg
				console.log(item2.token);
				var pushData = {
					priority: "high",
					content_available: true,
					to: item2.token,
					data: {
						title: "님에게서 메시지가 왔습니다.",
						body: "1234",
						type: "chat",
						sender: 1,
						chat_id: 16,
						msg: "1234",
						send_time: now,
					},
				};
				fcm.send(pushData, function (err, response) {
					console.log("response", response);
					console.log("error :: " + err);
					if (err) {
						//var deleteFCM = con.query("delete from pt_v1.fcm where token = ?", [item2.token]);
					}
				});
			});
		}
	);
	res.send("hello");
});

app.get("/moning_push/", (req, res, next) => {
	var now = new Date().toLocaleString("en-US", {
		timeZone: "Asia/Seoul",
	});
	// console.log(req.params.id)
	let users = sCon.query(
		"SELECT user.*, user_noti.alarm as all_noti, user_noti.soc as soc_noti, user_fcm.token as fcm_token FROM user LEFT JOIN user_noti ON user.id = user_noti.user_id LEFT JOIN user_fcm ON user.id = user_fcm.token"
	);
	users.map((user) => {
		if (user.fcm_token) {
			if (user.all_noti == 1 && user.soc_noti == 1) {
				var pushData = {
					priority: "high",
					content_available: true,
					to: user.fcm_token,
					data: {
						title: "싹(SOC)이 업데이트 되었습니다!!",
						body:
							"어제의 활동으로 ‘싹’ " +
							user.soc +
							"로 레벨이 " +
							user.lv +
							"로 변경되었습니다!!",
						type: "soc",
						sender: 1,
						send_time: now,
					},
				};
				fcm.send(pushData, function (err, response) {
					console.log("response", response);
					console.log("error :: " + err);
					if (err) {
						//var deleteFCM = con.query("delete from pt_v1.fcm where token = ?", [item2.token]);
					}
				});
			}
		}
	});

	res.send("hello");
});

app.get("/pin_comming/", (req, res, next) => {
	var now = new Date();
	var ready = new Date();
	ready.setHours(ready.getHours() + 3);

	var nowText = formatDate(now);
	let selectPinRoom = sCon.query(
		"SELECT * FROM chat WHERE pinned = 1 AND pin_promise_time IS NOT NULL"
	);
	selectPinRoom.map((chat) => {
		let pin_log = sCon.query(
			"SELECT * FROM chat_pin_log WHERE chat_id = ? ORDER BY id DESC LIMIT 1",
			chat.id
		);
		if (pin_log.length != 0) {
			pinned = pin_log[0];
			if (pinned.pin_promise_time != null) {
				if (
					new Date(pinned.pin_promise_time) > now &&
					new Date(pinned.pin_promise_time) < ready
				) {
					// 맴버들 전원에게 3시간 전 알림 보내기
					if (pinned.pushed == 0) {
						sCon.query("UPDATE chat_pin_log SET pushed = 1 WHERE chat_id = ?", [
							chat.id,
						]);
						let users = sCon.query(
							"SELECT user.*, user_noti.alarm as all_noti, user_noti.soc as soc_noti, user_fcm.token as fcm_token FROM user LEFT JOIN user_noti ON user.id = user_noti.user_id LEFT JOIN user_fcm ON user.id = user_fcm.token LEFT JOIN chat_member on user.id = chat_member.user_id WHERE chat_member.chat_id = ?",
							[chat.id]
						);
						users.map((user) => {
							if (user.fcm_token) {
								if (user.all_noti == 1) {
									var pushData = {
										priority: "high",
										content_available: true,
										to: user.fcm_token,
										data: {
											title: "약속시간 3시간 전입니다.",
											body: "지오핀으로 약속하신 시간이 3시간 남았습니다.",
											sender: 1,
											send_time: now,
											type: "chat",
											chat_id: chat.id,
										},
									};
									fcm.send(pushData, function (err, response) {
										console.log("response", response);
										console.log("error :: " + err);
										if (err) {
											//var deleteFCM = con.query("delete from pt_v1.fcm where token = ?", [item2.token]);
										}
									});
								}
							}
						});
					}
					let members = sCon.query(
						"SELECT user.*, user_noti.alarm as all_noti, user_noti.soc as soc_noti, user_fcm.token as fcm_token FROM user LEFT JOIN user_noti ON user.id = user_noti.user_id LEFT JOIN user_fcm ON user.id = user_fcm.token LEFT JOIN chat_member on user.id = chat_member.user_id WHERE chat_member.chat_id = ? AND chat_member.pin_pushed != ?",
						[chat.id, pinned.id]
					);
					members.map((member) => {
						let dist = distance(
							member.lat,
							member.lng,
							pinned.lat,
							pinned.lng,
							"K"
						);
						if (dis <= 0.5) {
							sCon.query(
								"UPDATE chat_member SET pin_pushed = ? WHERE user_id = ? AND chat_id = ?",
								[pinned.id, member.user_id, member.chat_id]
							);
							let users = sCon.query(
								"SELECT user.*, user_noti.alarm as all_noti, user_noti.soc as soc_noti, user_fcm.token as fcm_token FROM user LEFT JOIN user_noti ON user.id = user_noti.user_id LEFT JOIN user_fcm ON user.id = user_fcm.token LEFT JOIN chat_member on user.id = chat_member.user_id WHERE chat_member.chat_id = ?, chat_member.user_id != ?",
								[chat.id, member.user_id]
							);
							users.map((user) => {
								if (user.fcm_token) {
									if (user.all_noti == 1) {
										var pushData = {
											priority: "high",
											content_available: true,
											to: user.fcm_token,
											data: {
												title: members.nickname,
												body:
													members.nickname +
													"님께서 약속장소 500 이내에 접근했습니다.",
												sender: 1,
												send_time: now,
												type: "chat",
												chat_id: chat.id,
											},
										};
										fcm.send(pushData, function (err, response) {
											console.log("response", response);
											console.log("error :: " + err);
											if (err) {
												//var deleteFCM = con.query("delete from pt_v1.fcm where token = ?", [item2.token]);
											}
										});
									}
								}
							});
						}
					});
				}
			}
		}
	});

	res.send("hello");
});

function distance(lat1, lon1, lat2, lon2, unit) {
	if (lat1 == lat2 && lon1 == lon2) {
		return 0;
	} else {
		var radlat1 = (Math.PI * lat1) / 180;
		var radlat2 = (Math.PI * lat2) / 180;
		var theta = lon1 - lon2;
		var radtheta = (Math.PI * theta) / 180;
		var dist =
			Math.sin(radlat1) * Math.sin(radlat2) +
			Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = (dist * 180) / Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit == "K") {
			dist = dist * 1.609344;
		}
		if (unit == "N") {
			dist = dist * 0.8684;
		}
		return dist;
	}
}

function formatDate(date) {
	var d = new Date(date),
		month = "" + (d.getMonth() + 1),
		day = "" + d.getDate(),
		year = d.getFullYear(),
		hours = "" + d.getHours(),
		minute = d.getMinutes(),
		second = d.getSeconds();

	if (month.length < 2) month = "0" + month;
	if (day.length < 2) day = "0" + day;

	var fommatted = [year, month, day].join("-");

	return fommatted + " " + hours + ":" + minute + ":" + second;
}

// 푸시 전송 로직
// targets.map(item2=>{
//   var pushData = {
//     priority: 'high',
//     content_available: true,
//     to: item2.token,
//     data:{
//       title: req.body.title,
//       body: req.body.msg,
//       type: 'master', // master
//       sender: "master",
//       msg: req.body.msg,
//       send_time: current_time,
//     }
//   };
//   fcm.send(pushData, function(err, response){
//     // console.log("error :: "+err);
//     if(err){
//       // var deleteFCM = con.query("delete from pt_v1.fcm where token = ?", [item2.token]);
//     }
//   });
// });

// push 전송 기능
// app.post('/push',passport.authenticate('jwt', {session: false}),(req,res)=>{
//   var user = req.user[0];
//   if(req.body.title && user && req.body.msg && req.body.target_id){

//     // var targets = con.query("select token from pt_v1.fcm WHERE user_id = ?", [req.body.target_id]);
//     // if(targets.length > 0){
//     //   var current_time = new Date();

//     // }

//     return res.status(200).json({result: true});
//   }else{
//     return res.status(400).json({result:false});
//   }

// });

let chat = io.on("connection", (socket) => {
	console.log("소켓서버 연결 user_id", socket.decoded_token.id);

	// 방 조인
	socket.on("join", function (data) {
		if (data) {
			// user id : socket.decoded_token.id
			// room id : data.room
			if (socket.decoded_token.id && data.room) {
				con.query(
					"select id from chat_member where user_id = ? and chat_id = ?",
					[socket.decoded_token.id, data.room],
					function (err, result) {
						if (err) throw err;
						// 맴버인지 확인하기

						if (result.length != 0) {
							// 조인 시키기
							console.log("join room" + data.room);
							socket.join(data.room);
						}
					}
				);
			}
		}
	});

	// 소켓 나가기
	socket.on("leave", function (data) {
		if (data) {
			// user id : socket.decoded_token.id
			// room id : data.room
			if (socket.decoded_token.id && data.room) {
				con.query(
					"select id from chat_member where user_id = ? and chat_id = ?",
					[socket.decoded_token.id, data.room],
					function (err, result) {
						if (err) throw err;
						// 맴버인지 확인하기

						if (result.length != 0) {
							// 나가기 시키기
							console.log("leave room" + data.room);
							socket.leave(data.room);
						}
					}
				);
			}
		}
	});

	// 메시지 발송
	socket.on("chat", function (data) {
		// console.log(data)
		// now 구성하기
		var now = new Date().toLocaleString("en-US", {
			timeZone: "Asia/Seoul",
		});

		var nowText = formatDate(now);

		var user_id = socket.decoded_token.id;
		let room = data.room;

		// read, location, pin-insert, pin-del, join, out
		// 이경우엔 각각의 다른 프로세스가 존재함...
		if (
			data.type == "read" ||
			data.type == "location" ||
			data.type == "join" ||
			data.type == "out" ||
			data.type == "pin-del" ||
			data.type == "typing" ||
			data.type == "ready"
		) {
			con.query("SELECT * FROM user WHERE id = ?", [user_id], function (
				err,
				result
			) {
				if (result.length == 0) {
					return;
				}
				var sender = result[0];
				if (data.type != "read") {
					// msg 구성
					// 메시지, type, lat, lng, time
					let msg = {
						user_id: user_id + "",
						lv: sender.lv,
						profile: sender.profile,
						profile_thumb: sender.profile_thumb,
						sender: user_id + "",
						msg: "",
						type: data.type,
						lat: data.lat + "",
						lng: data.lng + "",
						time: nowText,
					};
					// 메시지 전송
					chat.to(room).emit("chat", msg);
				}

				// read의 경우 카운트 정리해주기
				if (data.type == "read") {
					var user_checker = [];
					con.query(
						"select chat_member.* from chat_member where chat_id = " +
							room +
							" AND user_id = " +
							user_id,
						[],
						function (err, result) {
							if (err) throw err;
							user_checker = result;
							if (user_checker.length != 0) {
								var user_info = user_checker[0];
								// user unread 확인 (몇개 안읽은 것인지 확인하는 것)
								var user_unread_cnt = user_info.unread_cnt;

								// 메시지, type, lat, lng, time, unread_cnt
								let msg = {
									user_id: user_id + "",
									sender: user_id + "",
									msg: "",
									lv: sender.lv,
									profile: sender.profile,
									profile_thumb: sender.profile_thumb,
									type: data.type,
									lat: data.lat + "",
									lng: data.lng + "",
									time: nowText,
									unread_cnt: user_unread_cnt,
								};
								// 메시지 전송
								chat.to(room).emit("chat", msg);
								// 모두 읽음 처리 먼저
								con.query(
									"update chat_member set unread_cnt = 0 where chat_id = ? AND user_id = ?",
									[room, user_id],
									function (err, result) {
										if (err) throw err;
									}
								);
								let lastZero = sCon.query(
									"select * from chat_msg where unread_cnt = 0 and chat_id = ? order by id desc limit 1",
									[room]
								);
								if (lastZero.length != 0) {
									if (lastZero[0].id) {
										sCon.query(
											"update chat_msg set unread_cnt = 0 where chat_id = ? and id <= ?",
											[room, lastZero[0].id]
										);
									}
								}

								// msg find
								var msgs = [];
								con.query(
									"SELECT * FROM chat_msg WHERE chat_id = ? ORDER BY id DESC LIMIT ?",
									[room, user_unread_cnt],
									function (err, result) {
										if (err) throw err;
										msgs = result;
										msgs.map((item) => {
											// 읽음이 넘어왔으므로 차감 로직
											con.query(
												"update chat_msg set unread_cnt = unread_cnt - 1 where id = " +
													item.id,
												[],
												function (err, result) {
													if (err) throw err;
												}
											);
										});
									}
								);
							}
						}
					);
				}
			});
			return;
		}

		// 차단 한 유저, 차단당한 유저 확인
		// var blockMembers = [];
		// var blockMemberQuery = con.query("SELECT * FROM connected WHERE user_id = ? AND blocked = 1", [user_id]);
		// if (blockMemberQuery.length != 0) {
		//   blockMemberQuery.map(item=> {
		//     blockMembers.push(item.target_id)
		//   })
		// }
		var blockedMembers = [];
		var blockedMemberQuery = [];
		con.query(
			"SELECT * FROM connected WHERE target_id = ? AND blocked = 1",
			[user_id],
			function (err, result) {
				if (err) throw err;
				blockedMemberQuery = result;
				if (blockedMemberQuery.length != 0) {
					for (let i = 0; i < blockedMemberQuery.length; i++) {
						const item = blockedMemberQuery[i];
						blockedMembers.push(item.user_id);
					}
				}
				// 차단당한 사람에겐 내 메시지에 대한 알람이 안가야하고
				// (fcm push 가 없어야 한다)
				// 읽어야 할 사람에 안가야 한다
				// (읽어야 할 사람 숫자에 증가가 안되어야 한다)

				// 차단한 사람에게는 메시지는 간다
				// 읽어야 할 사람 숫자에도 증가가 된다
				// 어디다 쓰지?
				// 쓸데 없어보인다

				// 방 인원 조회
				// unread cnt를 위한...
				var members;
				con.query(
					"select chat_member.* from chat_member where chat_id = ? AND user_id != ?",
					[room, user_id],
					function (err, result) {
						if (err) throw err;
						members = result;
						if (blockedMembers.length != 0) {
							for (let i = 0; i < members.length; i++) {
								const member = members[i];
								// 차단 당한 목록에 있는 사람인지
								if (blockedMembers.indexOf(member.user_id) != -1) {
									// 멤버에서 제거한다
									// 그럼 그사람에게는 푸시도 안가고
									// 메시지 안읽은 사람 수에도 포함되지 않는다..
									members.splice(i, 1);
								}
							}
						}

						// 데이터베이스 저장 프로세스
						let sql =
							"INSERT INTO chat_msg (user_id, chat_id, type, msg, _at, unread_cnt, lat, lng) VALUES (?,?,?,?,?,?,?,?)";
						let params = [
							user_id,
							room,
							data.type,
							data.msg,
							nowText,
							members.length,
							data.lat,
							data.lng,
						];
						var insert_msg = con.query(sql, params, function (err, result) {
							if (err) throw err;
							// console.log(result)
							var msg_id = result.insertId;

							// title을 위한 유저의 닉네임을 파인드 해야한다
							var senderSql = [];
							con.query("SELECT * FROM user WHERE id = ?", [user_id], function (
								err,
								result
							) {
								if (err) throw err;
								senderSql = result;
								var sender = senderSql[0];
								var sender_nickname = sender.nickname;

								// last msg update
								con.query(
									"UPDATE chat SET last_msg_user = ?, last_msg = ?, last_msg_at = ?, last_msg_type = ? WHERE id = ?",
									[user_id, data.msg, nowText, data.type, room],
									function (err, result) {
										if (err) throw err;
										// msg 구성
										// 메시지, type, lat, lng, time
										let msg = {
											id: msg_id + "",
											user_id: user_id + "",
											nickname: sender_nickname,
											lv: sender.lv,
											profile: sender.profile,
											profile_thumb: sender.profile_thumb,
											msg: data.msg,
											type: data.type,
											lat: data.lat + "",
											lng: data.lng + "",
											_at: nowText,
											unread_cnt: members.length + "",
										};
										// let msg = { msg:data.msg }
										// 메시지 전송
										let emit = chat.to(room).emit("chat", msg);
										if (members.length == 1) {
											sCon.query(
												"UPDATE chat_member SET hidden = 0 WHERE chat_id = ?",
												[room]
											);
										}

										// 나를 제외한 맴버에 대한 각종 처리
										members.map((item) => {
											// 언레드 숫자 증가
											// 차단된 사람은 제외하고 넣어야함...
											con.query(
												"update chat_member set unread_cnt = (chat_member.unread_cnt + 1) where user_id = " +
													item.user_id +
													" and chat_id = " +
													data.room,
												[],
												function (err, result) {
													if (err) throw err;
													// senderSql = result
													// 알람 관련 체크
													if (item.noti != 0) {
														con.query(
															"SELECT alarm FROM user WHERE id = " +
																item.user_id,
															[],
															function (err, result) {
																if (err) throw err;
																var users = result;
																member = users[0];
																// 방 노티, 앱 알람 온인지 확인
																if (item.noti == 1 && member.alarm == 1) {
																	// sender에 셋네임이 있는지 확인하기
																	var connected = [];
																	con.query(
																		"SELECT * FROM connected WHERE user_id = ? AND target_id = ?",
																		[item.user_id, user_id],
																		function (err, result) {
																			if (err) throw err;
																			connected = result;
																			if (connected.length != 0) {
																				sender_nickname = connected[0].set_name;
																			}

																			// fcm 발송!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
																			// user fcm find
																			let chat_info = sCon.query(
																				"select share_room from chat where id = ?",
																				[room]
																			);
																			var fcm_list = [];
																			con.query(
																				"SELECT token FROM user_fcm WHERE user_id = ?",
																				[item.user_id],
																				function (err, result) {
																					if (err) throw err;
																					fcm_list = result;
																					fcm_list.map((item2) => {
																						// fcm 데이터 형성
																						// title : 누구님에게 메시지가 도착했습니다
																						// body : 메시지 내용
																						// sender : sender_id
																						// type : msg

																						var pushData = {
																							priority: "high",
																							content_available: true,
																							to: item2.token,
																							data: {
																								title:
																									sender_nickname +
																									"님에게서 메시지가 왔습니다.",
																								body: data.msg,
																								type: "chat",
																								chat_id: room,
																								sender: user_id,
																								msg: data.msg,
																								send_time: now,
																								share_room:
																									chat_info.share_room,
																							},
																						};
																						fcm.send(pushData, function (
																							err,
																							response
																						) {
																							console.log("error :: " + err);
																							if (err) {
																								//var deleteFCM = con.query("delete from pt_v1.fcm where token = ?", [item2.token]);
																							}
																						});
																					});
																				}
																			);
																		}
																	);
																}
															}
														);
													}
												}
											);
										});
									}
								);
							});
						});
					}
				);
			}
		);
	});
});

/*
io.sockets
  .on('connection', socketioJwt.authorize({
    secret: secretObj.secret,
  }))
  .on('authenticated', (socket) => {
    //this socket is authenticated, we are good to handle more events from it.
    console.log(`user_id, ${socket.decoded_token.id}`);
    socket.on('chat', function(data){
      console.log(data)
      let msg = {msg:data.msg}
      socket.emit('chat',msg)
    })
  });
*/
server.listen(3000, function () {
	console.log("Socket IO server listening on port 3000");
});
