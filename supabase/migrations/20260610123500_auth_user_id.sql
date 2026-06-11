-- Añadir columna auth_user_id a clientes si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'auth_user_id') THEN
        ALTER TABLE clientes ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        ALTER TABLE clientes ADD CONSTRAINT clientes_auth_user_id_key UNIQUE (auth_user_id);
    END IF;
END $$;

-- Función para vincular un cliente autenticado de Supabase Auth con la tabla pública 'clientes'
CREATE OR REPLACE FUNCTION vincular_cliente_auth(
    p_nombre TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_auth_id UUID;
    v_phone TEXT;
    v_cliente_id UUID;
    v_cliente_nombre TEXT;
BEGIN
    -- 1. Obtener el ID del usuario autenticado
    v_auth_id := auth.uid();
    IF v_auth_id IS NULL THEN
        RETURN json_build_object('error', 'Usuario no autenticado');
    END IF;

    -- 2. Obtener el teléfono del usuario desde auth.users
    SELECT phone INTO v_phone FROM auth.users WHERE id = v_auth_id;
    IF v_phone IS NULL THEN
        RETURN json_build_object('error', 'El usuario no tiene un teléfono registrado');
    END IF;

    -- Limpiar el teléfono (quitar el + si lo tiene y dejar los últimos 10 dígitos para que coincida con la lógica de MUYMUY)
    v_phone := right(regexp_replace(v_phone, '\D', '', 'g'), 10);

    -- 3. Buscar si ya existe un cliente con ese teléfono en la tabla pública
    SELECT id, nombre_completo INTO v_cliente_id, v_cliente_nombre FROM clientes WHERE telefono_cel = v_phone LIMIT 1;

    IF v_cliente_id IS NOT NULL THEN
        -- El cliente ya existe. Vincular el auth_user_id si no lo tiene.
        UPDATE clientes 
        SET auth_user_id = v_auth_id,
            -- Actualizar correo solo si el usuario mandó uno nuevo y el actual está vacío
            email = COALESCE(NULLIF(TRIM(clientes.email), ''), p_email)
        WHERE id = v_cliente_id;
        
        RETURN json_build_object(
            'success', true, 
            'cliente_id', v_cliente_id, 
            'nombre', v_cliente_nombre,
            'is_new', false
        );
    ELSE
        -- El cliente no existe. Requiere el nombre para crearlo.
        IF p_nombre IS NULL OR trim(p_nombre) = '' THEN
            RETURN json_build_object('error', 'Falta el nombre completo para crear el perfil');
        END IF;

        INSERT INTO clientes (nombre_completo, telefono_cel, email, auth_user_id)
        VALUES (p_nombre, v_phone, p_email, v_auth_id)
        RETURNING id INTO v_cliente_id;

        RETURN json_build_object(
            'success', true, 
            'cliente_id', v_cliente_id, 
            'nombre', p_nombre,
            'is_new', true
        );
    END IF;
END;
$$;

-- Otorgar permisos al rol authenticated
GRANT EXECUTE ON FUNCTION vincular_cliente_auth(TEXT, TEXT) TO authenticated;
