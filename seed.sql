INSERT INTO trips (name, start_date, end_date) VALUES 
('Kyoto Trip', '2026-04-10', '2026-04-15'),
('Summer in Paris', '2026-06-01', '2026-06-05');

INSERT INTO timeline_items (trip_id, day_number, time_mark, title, maps_url, description) VALUES 
(1, 1, '10:00 AM', 'Arrive at KIX', 'https://maps.google.com/?q=Kansai+International+Airport', 'Pick up JR Pass'),
(1, 1, '13:00 PM', 'Check into Hotel', 'https://maps.google.com/?q=Hotel+Chuo+Kyoto', 'Rest before going out'),
(1, 2, '09:00 AM', 'Visit Fushimi Inari', 'https://maps.google.com/?q=Fushimi+Inari+Taisha', 'Get there early to avoid crowds'),
(2, 1, '15:00 PM', 'Eiffel Tower', 'https://maps.google.com/?q=Eiffel+Tower', 'Book tickets in advance');

INSERT INTO expenses (trip_id, timeline_item_id, amount, description, expense_date) VALUES 
(1, NULL, 50.00, 'SIM Card', '2026-04-10'),
(1, 1, 20.00, 'Airport Train', '2026-04-10'),
(1, 3, 10.00, 'Temple Donation', '2026-04-11'),
(2, 4, 30.00, 'Eiffel Tower Ticket', '2026-06-01');
