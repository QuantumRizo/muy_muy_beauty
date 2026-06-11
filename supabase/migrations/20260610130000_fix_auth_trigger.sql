-- Fix the trigger handle_new_user so it doesn't fail when a user logs in via phone (no email).
-- We only want to create a `perfiles_usuario` for users that sign up with email (admins/staff).
-- For clients (who sign in via phone), we just skip the insert and return NEW.

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Si no tiene email (se registró por teléfono celular), es un cliente de la app móvil.
    -- Los clientes se manejan en la tabla 'clientes', no en 'perfiles_usuario'.
    IF NEW.email IS NULL OR NEW.email = '' THEN
        RETURN NEW;
    END IF;

    -- Si tiene email, es un administrador o staff.
    INSERT INTO public.perfiles_usuario (id, email, nombre, rol)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'rol', 'admin')
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$function$;
