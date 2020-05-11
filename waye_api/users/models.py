from django.contrib.auth.models import AbstractBaseUser,BaseUserManager,PermissionsMixin
from django.db import models 

class UserManager(BaseUserManager):    
    
    use_in_migrations = True    
    
    def create_user(self, username, password=None):        
        
        user = self.model(                   
            username = username        
        )        
        user.set_password(password)        
        user.save(using=self._db)        
        return user
    def create_superuser(self, username, password):
        user = self.create_user(            
            username = username,            
            password = password        
        )        
        user.is_admin = True        
        user.is_superuser = True        
        user.is_staff = True        
        user.save(using=self._db)        
        return user 
class User(AbstractBaseUser,PermissionsMixin):    
    objects = UserManager()
    username = models.CharField(
        max_length=100,
        null=False,
        unique=True
    )
    first_name = None
    last_name = None
    email = models.EmailField(null=True, max_length=254)
    profile = models.CharField(null=True,max_length=255)
    profile_thumb = models.CharField(null=True,max_length=255)
    background = models.CharField(null=True,max_length=255)
    background_thumb = models.CharField(null=True,max_length=255)
    lat = models.FloatField(null=True)
    lng = models.FloatField(null=True)
    phone = models.CharField(max_length=50, null=True)
    gender = models.SmallIntegerField(null=True)
    birth = models.DateField(null=True, auto_now=False, auto_now_add=False)
    lv = models.IntegerField(null=False, default=0)
    des = models.CharField(max_length=100, null=True)
    alarm = models.SmallIntegerField(null=False, default=1)
    last_income = models.DateTimeField(auto_now=True)
    recommender = models.CharField(max_length=255, null=True)
    profile_recommender = models.SmallIntegerField(null=False, default=1)
    join_by = models.CharField(max_length=50, default='nickname')
    sns_token = models.CharField(max_length=255, null=True)
    is_active = models.BooleanField(default=True)    
    is_admin = models.BooleanField(default=False)    
    is_superuser = models.BooleanField(default=False)    
    is_staff = models.BooleanField(default=False)     
    _at = models.DateTimeField(auto_now_add=True)
    last_contact_sync = models.DateTimeField(auto_now=True)
    marketing_confirm = models.SmallIntegerField(null=True)
    last_location_update = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'username'

def has_perm(self, perm, obj=None):
    return True

def has_module_perms(self, app_label):
    return True

@property
def is_staff(self):
    return self.is_admin