-- تحديث إعدادات التطبيق بروابط الصور الافتراضية
UPDATE app_settings 
SET 
  login_background_url = 'https://scontent-ham3-1.xx.fbcdn.net/v/t39.30808-6/490910684_606105959129344_589045621789059215_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=rsL2jEpAqkYQ7kNvwHhOXq3&_nc_oc=AdnrLhL0NUhvuZBIYAFJ5vOITgn0_ej4KGn-yB8Pb8bF30vHt595Gs2Xrtu1_pxbl4o&_nc_zt=23&_nc_ht=scontent-ham3-1.xx&_nc_gid=wHDuF0RUcWSnis5Ba3NxMQ&oh=00_AfjsydzJJ-b5nEWZ6zDP-I-lxwngKNtFlvrwGpuXh7AcHw&oe=6929535E',
  app_icon_url = 'https://scontent-ham3-1.xx.fbcdn.net/v/t39.30808-6/490910684_606105959129344_589045621789059215_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=rsL2jEpAqkYQ7kNvwHhOXq3&_nc_oc=AdnrLhL0NUhvuZBIYAFJ5vOITgn0_ej4KGn-yB8Pb8bF30vHt595Gs2Xrtu1_pxbl4o&_nc_zt=23&_nc_ht=scontent-ham3-1.xx&_nc_gid=wHDuF0RUcWSnis5Ba3NxMQ&oh=00_AfjsydzJJ-b5nEWZ6zDP-I-lxwngKNtFlvrwGpuXh7AcHw&oe=6929535E',
  updated_at = NOW()
WHERE id = 1;

-- إذا لم يكن هناك سجل موجود، قم بإنشاء واحد
INSERT INTO app_settings (id, login_background_url, app_icon_url, app_name, created_at, updated_at)
SELECT 
  1,
  'https://scontent-ham3-1.xx.fbcdn.net/v/t39.30808-6/490910684_606105959129344_589045621789059215_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=rsL2jEpAqkYQ7kNvwHhOXq3&_nc_oc=AdnrLhL0NUhvuZBIYAFJ5vOITgn0_ej4KGn-yB8Pb8bF30vHt595Gs2Xrtu1_pxbl4o&_nc_zt=23&_nc_ht=scontent-ham3-1.xx&_nc_gid=wHDuF0RUcWSnis5Ba3NxMQ&oh=00_AfjsydzJJ-b5nEWZ6zDP-I-lxwngKNtFlvrwGpuXh7AcHw&oe=6929535E',
  'https://scontent-ham3-1.xx.fbcdn.net/v/t39.30808-6/490910684_606105959129344_589045621789059215_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=rsL2jEpAqkYQ7kNvwHhOXq3&_nc_oc=AdnrLhL0NUhvuZBIYAFJ5vOITgn0_ej4KGn-yB8Pb8bF30vHt595Gs2Xrtu1_pxbl4o&_nc_zt=23&_nc_ht=scontent-ham3-1.xx&_nc_gid=wHDuF0RUcWSnis5Ba3NxMQ&oh=00_AfjsydzJJ-b5nEWZ6zDP-I-lxwngKNtFlvrwGpuXh7AcHw&oe=6929535E',
  'تراث المندي',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE id = 1);
