UPDATE instructor_kpi SET pdd_status = 'Сдал' WHERE pdd_status = 'sdal';
ALTER TABLE instructor_kpi ALTER COLUMN pdd_status TYPE varchar(20);
