INSERT INTO sucursales (id, nombre, direccion, telefono, rfc, num_cabinas, hora_apertura, hora_cierre, hora_apertura_finde, hora_cierre_finde, horarios_por_dia)
VALUES
('4a84af78-ea23-4b04-bb76-424895af6896', 'Newton', 'Av. Isaac Newton 215, Polanco, Polanco V Secc, Miguel Hidalgo, 11560 Ciudad de México, CDMX', '56 1901 1318', 'GSE120523BI9', 1, '08:00:00', '21:00:00', '09:00:00', '18:00:00', '{"0":{"cierre":"18:00","cerrado":false,"apertura":"10:00:00"},"1":{"cierre":"20:00:00","cerrado":false,"apertura":"10:00:00"},"2":{"cierre":"20:00:00","cerrado":false,"apertura":"09:00:00"},"3":{"cierre":"20:00:00","cerrado":false,"apertura":"09:00:00"},"4":{"cierre":"20:00:00","cerrado":false,"apertura":"09:00:00"},"5":{"cierre":"08:00:00","cerrado":false,"apertura":"09:00:00"},"6":{"cierre":"18:00","cerrado":false,"apertura":"10:00:00"}}'::jsonb),
('c0fef048-89eb-47c7-b480-92f14312d7c3', 'Campos Eliseos', 'Campos Elíseos 169, Polanco, Polanco V Secc, Miguel Hidalgo, 11580 Ciudad de México, CDMX', '55 4453 3065', 'CBE211202HRA', 1, '08:00:00', '21:00:00', '09:00:00', '18:00:00', '{"0":{"cierre":"18:00","cerrado":false,"apertura":"10:00:00"},"1":{"cierre":"20:00:00","cerrado":false,"apertura":"10:00:00"},"2":{"cierre":"20:00:00","cerrado":false,"apertura":"10:00:00"},"3":{"cierre":"20:00:00","cerrado":false,"apertura":"10:00:00"},"4":{"cierre":"20:00:00","cerrado":false,"apertura":"10:00:00"},"5":{"cierre":"20:00:00","cerrado":false,"apertura":"10:00:00"},"6":{"cierre":"18:00","cerrado":false,"apertura":"10:00:00"}}'::jsonb),
('02ea177b-e46f-464a-bcc5-1906e0de7aa7', 'Homero', 'Av. Homero 1629, Polanco, Polanco I Secc, Miguel Hidalgo, 11510 Ciudad de México, CDMX', '55 2703 2830', 'CBE211202HRA', 1, '08:00:00', '21:00:00', '09:00:00', '18:00:00', '{"0":{"cierre":"18:00","cerrado":false,"apertura":"10:00:00"},"1":{"cierre":"20:00:00","cerrado":false,"apertura":"10:00:00"},"2":{"cierre":"20:00:00","cerrado":false,"apertura":"10:00:00"},"3":{"cierre":"20:00:00","cerrado":false,"apertura":"10:00:00"},"4":{"cierre":"20:00:00","cerrado":false,"apertura":"10:00:00"},"5":{"cierre":"20:00:00","cerrado":false,"apertura":"10:00:00"},"6":{"cierre":"18:00","cerrado":false,"apertura":"10:00:00"}}'::jsonb),
('4dce32b8-a7d8-47e5-a769-2b6c1fd2d537', 'Euler', 'Euler 152, Chapultepec Morales, Polanco V Secc, Miguel Hidalgo, 11550 Ciudad de México, CDMX', '55 4939 5929', 'CBE211202HRA', 1, '08:00:00', '21:00:00', '09:00:00', '18:00:00', '{"0":{"cierre":"18:00","cerrado":false,"apertura":"10:00:00"},"1":{"cierre":"20:00:00","cerrado":false,"apertura":"10:00:00"},"2":{"cierre":"20:00:00","cerrado":false,"apertura":"10:00:00"},"3":{"cierre":"20:00:00","cerrado":false,"apertura":"10:00:00"},"4":{"cierre":"20:00:00","cerrado":false,"apertura":"10:00:00"},"5":{"cierre":"20:00:00","cerrado":false,"apertura":"10:00:00"},"6":{"cierre":"18:00","cerrado":false,"apertura":"10:00:00"}}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categorias_servicio (id, nombre, descripcion, imagen_url, orden, activo, created_at)
VALUES
('a1eabd89-96d7-43f5-a443-0baeffe70129', 'Esmaltado Permanente', 'La novedosa técnica que ha revolucionado el mundo de las uñas: el único esmaltado permanente de larga duración y 20Free.', 'https://rpoimbevndgwdkxifmbw.supabase.co/storage/v1/object/public/categorias/esmaltado_permanente.webp', 1, true, '2026-06-10T14:30:21.217766+00:00'),
('3b5e8f56-c61f-4678-90d6-dc99c2331b5e', 'Uñas Esculpidas', 'Uñas esculpidas con las mejores técnicas del mercado: uñas de gel, uñas en acrílico... ¡Ponte en buenas manos!', 'https://rpoimbevndgwdkxifmbw.supabase.co/storage/v1/object/public/categorias/unas_esculpidas.webp', 2, true, '2026-06-10T14:30:21.217766+00:00'),
('82bf9ef7-ee2b-4b02-accd-f937ac15c100', 'Manicura & Spa', '¡Tus manos hablan de ti! Cuídalas con nuestros servicios de manicura: limar y esmaltar, manicura básica, spa, etc.', 'https://rpoimbevndgwdkxifmbw.supabase.co/storage/v1/object/public/categorias/manicura.webp', 3, true, '2026-06-10T14:30:21.217766+00:00'),
('768ba08f-fc8a-4f5f-bce8-e6ec7ab4597f', 'Cuidado Facial', 'Protocolos de higiene profunda y tratamientos personalizados para una piel luminosa, sana y revitalizada.', 'https://rpoimbevndgwdkxifmbw.supabase.co/storage/v1/object/public/categorias/facial.webp', 4, true, '2026-06-10T14:30:21.217766+00:00'),
('d24cfd0e-bf1c-4716-b914-c48a2654ccdc', 'Masajes Terapéuticos', 'Un refugio para el estrés. Sesiones de relajación profunda y reflexología para restaurar tu equilibrio corporal y mental.', 'https://rpoimbevndgwdkxifmbw.supabase.co/storage/v1/object/public/categorias/masaje.webp', 5, true, '2026-06-10T14:30:21.217766+00:00'),
('95ef0958-5fd3-4735-8a60-a2bf8d5a56ef', 'Pedicura Avanzada', 'Salud y estética integral para tus pies. Desde relajantes sesiones spa hasta pedicuras técnicas especializadas.', 'https://rpoimbevndgwdkxifmbw.supabase.co/storage/v1/object/public/categorias/pedicura.webp', 6, true, '2026-06-10T14:30:21.217766+00:00'),
('a4d34ee1-80c5-4a7c-9197-9c845fc4ab35', 'Eyes & Brows', 'Realzamos tu mirada. Diseños de cejas y elevación de pestañas que enmarcan tu rostro con elegancia y naturalidad.', 'https://rpoimbevndgwdkxifmbw.supabase.co/storage/v1/object/public/categorias/eyes_beauty.webp', 7, true, '2026-06-10T14:30:21.217766+00:00'),
('7750ee93-274a-4421-a572-feefaeef8bf3', 'Depilación Premium', 'Suavidad duradera con técnicas delicadas y efectivas. Una experiencia de depilación profesional en un ambiente de confort.', 'https://rpoimbevndgwdkxifmbw.supabase.co/storage/v1/object/public/categorias/depilacion.webp', 8, true, '2026-06-10T14:30:21.217766+00:00'),
('bb2219d8-518a-40f3-9c52-2ba1b3f4e402', 'Nail Art & Diseño', 'El toque artístico final. Decoraciones exclusivas y diseños personalizados para que tus uñas sean una obra de arte.', 'https://rpoimbevndgwdkxifmbw.supabase.co/storage/v1/object/public/categorias/nail_art.webp', 9, true, '2026-06-10T14:30:21.217766+00:00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO servicios (id, nombre, duracion_slots, precio, activo, categoria_id)
VALUES
('f978e731-0bec-4ff8-b82a-5e4aa2202629', 'DEPILACION MANOS O PIES MUJER', 1, 50, true, '7750ee93-274a-4421-a572-feefaeef8bf3'),
('6272c36d-66fc-4566-83b6-0c191ea62b17', 'DEPILACION AXILAS-CUELLO-NUCA', 1, 200, true, '7750ee93-274a-4421-a572-feefaeef8bf3'),
('b26a925f-a50d-4f86-8bf1-2dfcb6b36171', 'DEPILACION BRAZOS-PECHO-GLUTEOS', 2, 490, true, '7750ee93-274a-4421-a572-feefaeef8bf3'),
('91233dd3-9216-4254-8ed6-3d07673740a0', 'DEPILACION PIERNAS COMPLETAS', 3, 650, true, '7750ee93-274a-4421-a572-feefaeef8bf3'),
('e57d084e-6474-46fe-b800-0ec38ffb059d', 'DEPILACION BIKINI FULL (BRASILEÑO)', 3, 700, true, '7750ee93-274a-4421-a572-feefaeef8bf3'),
('8f3b1f48-71fb-435b-a661-dcdd4a719226', 'SUPLEMENTO MANICURA RUSA', 2, 90, true, '82bf9ef7-ee2b-4b02-accd-f937ac15c100'),
('b7237197-11fc-4ca5-b1b5-eb0398b8d840', 'SUPLEMENTO GUANTE DE KERATINA', 1, 120, true, '82bf9ef7-ee2b-4b02-accd-f937ac15c100'),
('1adf6cb4-75d3-466a-a875-70cca16866f2', 'ESMALTADO RUBBER', 4, 450, true, 'a1eabd89-96d7-43f5-a443-0baeffe70129'),
('adaa7a68-5e03-4174-b6b3-05cb5472b518', 'ESMALTADO EN GEL', 2, 280, true, 'a1eabd89-96d7-43f5-a443-0baeffe70129'),
('1db5867e-0ed5-4724-a18b-85ef6d3d1e9b', 'RETIRO DE ESCULPIDO', 2, 220, true, '3b5e8f56-c61f-4678-90d6-dc99c2331b5e'),
('791dbc3e-f5ee-4565-8417-67776a50e514', 'ESCULPIDO + MANICURA + ESMALTADO PERMANENTE', 8, 1090, true, '3b5e8f56-c61f-4678-90d6-dc99c2331b5e'),
('356f4989-0ccb-49c8-8f38-41ed2c5eb4d7', 'MTTO ESCULPIDO CON ESMALTE PERMANENTE', 6, 700, true, '3b5e8f56-c61f-4678-90d6-dc99c2331b5e'),
('3728cd2d-9e57-4ea7-8618-f2ff7139bce8', 'ESCULPIDO CON ESMALTADO PERMANENTE', 6, 810, true, '3b5e8f56-c61f-4678-90d6-dc99c2331b5e'),
('1e09e40f-387e-4a16-9f7b-e02a49e3b80c', 'MTTO UÑAS ESCULPIDAS CON ESMALTE TRADICIONAL', 4, 420, true, '3b5e8f56-c61f-4678-90d6-dc99c2331b5e'),
('1bba88dc-c891-483a-a367-c683bdf4ab4d', 'ESCULPIDO CON ESMALTE TRADICIONAL', 4, 530, true, '3b5e8f56-c61f-4678-90d6-dc99c2331b5e'),
('d5b723db-7c98-4170-bd9a-f3022ea43cf2', 'Manicura SPA', 4, 350, true, '82bf9ef7-ee2b-4b02-accd-f937ac15c100'),
('27404ad6-6cd5-4351-b7bc-cea59b67cbf9', 'MANICURE SPA', 3, 350, true, '82bf9ef7-ee2b-4b02-accd-f937ac15c100'),
('79d97d89-d90e-4613-97e0-aef0ffb9507a', 'MANICURE', 2, 280, true, '82bf9ef7-ee2b-4b02-accd-f937ac15c100'),
('7446ace1-d5fd-4460-aca3-143699475782', 'HIGIENE FACIAL', 4, 600, true, '768ba08f-fc8a-4f5f-bce8-e6ec7ab4597f'),
('eaba6ef2-9eb7-45ea-82a4-80512042674d', 'DEPILACION ENTRECEJO', 1, 65, true, '768ba08f-fc8a-4f5f-bce8-e6ec7ab4597f'),
('42c8f8b0-a7be-4aae-bc9a-cc82d5e82c26', 'DEPILACION CARA COMPLETA SIN CEJAS', 3, 480, true, '768ba08f-fc8a-4f5f-bce8-e6ec7ab4597f'),
('7ec80b22-b020-461c-b4a8-32e69a8b2dfb', 'DEPILACION CEJA SIN DISEÑO', 3, 180, true, '768ba08f-fc8a-4f5f-bce8-e6ec7ab4597f'),
('476f8568-edbd-4d14-8d2d-074e2503d84f', 'DEPILACION CEJA CON DISEÑO', 3, 320, true, '768ba08f-fc8a-4f5f-bce8-e6ec7ab4597f'),
('319be8ce-7e90-43b3-994c-cab74d478543', 'REFLEXOLOGIA PODAL', 2, 300, true, 'd24cfd0e-bf1c-4716-b914-c48a2654ccdc'),
('d02213b4-7fc3-4d44-a40d-fa4771ab2677', 'MASAJE RELAJANTE DE 60 MIN', 4, 1100, true, 'd24cfd0e-bf1c-4716-b914-c48a2654ccdc'),
('eed4e52d-74c2-4470-8afb-ed6cdc883135', 'MASAJE RELAJANTE DE 30 MIN', 2, 660, true, 'd24cfd0e-bf1c-4716-b914-c48a2654ccdc'),
('94fdabca-6226-4254-a899-50b0a1c91ac7', 'PEDICURA TECNICA', 4, 550, true, '95ef0958-5fd3-4735-8a60-a2bf8d5a56ef'),
('f98a8ce3-81b3-45e7-a3e6-3d8166fd872f', 'PEDICURA SPA', 3, 550, true, '95ef0958-5fd3-4735-8a60-a2bf8d5a56ef'),
('cfbbb72a-3295-4e16-ab47-e37a688fdbf9', 'PEDICURA', 3, 400, true, '95ef0958-5fd3-4735-8a60-a2bf8d5a56ef'),
('8c180e1e-62d1-43f7-9e56-656d5c5966b2', 'TINTE DE PESTAÑAS', 3, 400, true, 'a4d34ee1-80c5-4a7c-9197-9c845fc4ab35'),
('b8bf8fe9-9c8b-4aba-b620-368cf90ff61a', 'LIFTING DE PESTAÑAS', 4, 730, true, 'a4d34ee1-80c5-4a7c-9197-9c845fc4ab35'),
('a696b145-7494-4428-9a1e-5eb7591bf777', 'TINTE DE CEJAS', 2, 230, true, 'a4d34ee1-80c5-4a7c-9197-9c845fc4ab35'),
('c259328c-22f4-4159-bb52-7b0642cc14cc', 'PLANCHADO DE CEJAS', 2, 400, true, 'a4d34ee1-80c5-4a7c-9197-9c845fc4ab35'),
('9a5cafd9-b538-4cf6-b6c5-6ba232dc6a4a', 'DECORACION BABY BOOMER - AURA', 1, 170, true, 'bb2219d8-518a-40f3-9c52-2ba1b3f4e402'),
('e8d4e1fc-ee43-429c-9fa5-9872f33fb5d6', 'DECORACION FRENCH', 1, 120, true, 'bb2219d8-518a-40f3-9c52-2ba1b3f4e402')
ON CONFLICT (id) DO NOTHING;

INSERT INTO perfiles_empleadas (id, nombre, activo, fecha_contratacion, sueldo_diario, sucursal_id, pin_hash)
VALUES
('1f138118-0f42-462e-ba92-b0e29bc151b1', 'DANIELA UGALDE CASTAÑEDA', true, '2020-06-03', 315, '4a84af78-ea23-4b04-bb76-424895af6896', NULL),
('b2940a12-4037-422c-80e9-d0fb8775dd8f', 'JOSS AGUILAR', true, NULL, NULL, '4a84af78-ea23-4b04-bb76-424895af6896', NULL),
('5de49a9c-339d-4f59-90e9-d3a769c49c5d', 'ITZEL LOPEZ SOLORZANO', true, '2022-08-01', 315, '4a84af78-ea23-4b04-bb76-424895af6896', NULL),
('db1ea9f5-67f1-40a8-849b-4cce7d251b86', 'NADIA VALERIA MEDINA CHAVEZ', true, '2023-09-04', 315, '4a84af78-ea23-4b04-bb76-424895af6896', NULL),
('461f8fa5-eeb6-463f-b980-0e521bf7e41f', 'MARIA ESTHER RAMIREZ VALENCIA', true, '2023-05-24', 315, '4a84af78-ea23-4b04-bb76-424895af6896', NULL),
('b0b61e26-8f62-4478-bd5c-80b94c979546', 'GRETEL RODRIGUEZ RODRIGUEZ', true, NULL, NULL, '4a84af78-ea23-4b04-bb76-424895af6896', NULL),
('689739b2-dc7b-42a5-8979-29f5e293845c', 'NATACHA YOSELIN CHIRINOS SANGUINETT', true, NULL, NULL, '4a84af78-ea23-4b04-bb76-424895af6896', NULL),
('603ee83a-d7fe-4fca-8582-fa7f80af0590', 'VALERIA PEDROSA CARDOSO', true, '2024-10-31', 400, '4a84af78-ea23-4b04-bb76-424895af6896', NULL),
('bc9957ca-f4b7-4386-8918-1002635adba9', 'GUADALUPE TONATZIN DELGADO SUBIAS', true, NULL, 400, '4a84af78-ea23-4b04-bb76-424895af6896', NULL),
('47e7971b-c54f-4550-826c-20f9a02fd99c', 'REBECA LEDEZMA', true, '2025-01-01', 400, 'c0fef048-89eb-47c7-b480-92f14312d7c3', NULL),
('0d8bd4e1-9690-4616-9042-20028048fea0', 'ITZEL DENISSE VARGAS ESPINOSA', true, '2026-02-25', 333, 'c0fef048-89eb-47c7-b480-92f14312d7c3', NULL),
('229de278-55d3-4ba3-a947-68a0e94d0842', 'ROSA SANCHEZ ESCALONA', true, '2023-09-24', 400, 'c0fef048-89eb-47c7-b480-92f14312d7c3', NULL),
('d29de395-656c-4fc7-82f5-d5b7edf71dfb', 'ANALIA CRUZ ANAYA', true, NULL, 500, 'c0fef048-89eb-47c7-b480-92f14312d7c3', NULL),
('6504b621-f101-41da-a95f-4a5fc616d090', 'KARLA YANELI PEREZ GASPAR', true, '2022-05-10', 315, '4dce32b8-a7d8-47e5-a769-2b6c1fd2d537', NULL),
('40dbbcc8-d73f-4d32-9cb1-c844320a0638', 'MAYERLIN VARGAS', true, '2024-10-31', 315, '4dce32b8-a7d8-47e5-a769-2b6c1fd2d537', NULL),
('073e5155-e66a-4de0-8de9-1db84a7e330b', 'ESTEPHANI JOANA ARELLANO SEGUNDO', true, '2023-10-18', 350, '4dce32b8-a7d8-47e5-a769-2b6c1fd2d537', NULL),
('143392a0-a85a-49c7-b55e-ff5b6b5147bc', 'PRISCILA ORALIA MARIN BAJO', true, NULL, 315, '4dce32b8-a7d8-47e5-a769-2b6c1fd2d537', NULL),
('7ac41335-79a6-4fbd-a586-f5ada8572fea', 'NORMA ANGELICA HERNANDEZ', true, '2024-10-18', 400, '02ea177b-e46f-464a-bcc5-1906e0de7aa7', NULL),
('55371238-5936-4f6b-a7c0-ebbd7ea613f4', 'ESPERANZA MONTSERRAT GUERRA', true, '2025-09-04', 400, '02ea177b-e46f-464a-bcc5-1906e0de7aa7', NULL),
('3c37f356-0133-44f4-83f0-ff0b2b146222', 'PAULA LETICIA MENDOZA MENDEZ', true, '2023-08-01', 315.04, '02ea177b-e46f-464a-bcc5-1906e0de7aa7', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO servicios (id, nombre, duracion_slots, precio, activo, categoria_id)
VALUES
('10000000-0000-4000-8000-000000000050', 'DECORACION $50', 1, 50.00, true, 'bb2219d8-518a-40f3-9c52-2ba1b3f4e402'),
('10000000-0000-4000-8000-000000000100', 'DECORACION $100', 1, 100.00, true, 'bb2219d8-518a-40f3-9c52-2ba1b3f4e402'),
('10000000-0000-4000-8000-000000000150', 'DECORACION $150', 1, 150.00, true, 'bb2219d8-518a-40f3-9c52-2ba1b3f4e402'),
('10000000-0000-4000-8000-000000000200', 'DECORACION $200', 1, 200.00, true, 'bb2219d8-518a-40f3-9c52-2ba1b3f4e402'),
('10000000-0000-4000-8000-000000000250', 'DECORACION $250', 1, 250.00, true, 'bb2219d8-518a-40f3-9c52-2ba1b3f4e402'),
('10000000-0000-4000-8000-000000000300', 'DECORACION $300', 1, 300.00, true, 'bb2219d8-518a-40f3-9c52-2ba1b3f4e402'),
('10000000-0000-4000-8000-000000000350', 'DECORACION $350', 1, 350.00, true, 'bb2219d8-518a-40f3-9c52-2ba1b3f4e402'),
('10000000-0000-4000-8000-000000000400', 'DECORACION $400', 1, 400.00, true, 'bb2219d8-518a-40f3-9c52-2ba1b3f4e402'),
('10000000-0000-4000-8000-000000000450', 'DECORACION $450', 1, 450.00, true, 'bb2219d8-518a-40f3-9c52-2ba1b3f4e402'),
('10000000-0000-4000-8000-000000000500', 'DECORACION $500', 1, 500.00, true, 'bb2219d8-518a-40f3-9c52-2ba1b3f4e402')
ON CONFLICT (id) DO NOTHING;

INSERT INTO servicios (id, nombre, duracion_slots, precio, activo, categoria_id)
VALUES
('f0000000-0000-4000-8000-000000000001', 'VITAMINA', 1, 100.00, true, 'a1eabd89-96d7-43f5-a443-0baeffe70129'),
('f0000000-0000-4000-8000-000000000002', 'RETIRO DE GEL', 1, 60.00, true, 'a1eabd89-96d7-43f5-a443-0baeffe70129')
ON CONFLICT (id) DO NOTHING;
