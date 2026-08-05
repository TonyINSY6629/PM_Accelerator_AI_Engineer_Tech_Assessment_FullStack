-- WMO Weather interpretation codes (WW)
-- Source: https://open-meteo.com/en/docs
-- INSERT OR IGNORE makes this safe to run on every startup.

INSERT OR IGNORE INTO weather_codes (weather_code, description, icon) VALUES
    (0,  'Clear sky',                         'clear'),
    (1,  'Mainly clear',                      'partly-cloudy'),
    (2,  'Partly cloudy',                     'partly-cloudy'),
    (3,  'Overcast',                          'cloudy'),
    (45, 'Fog',                               'fog'),
    (48, 'Depositing rime fog',               'fog'),
    (51, 'Drizzle: light',                    'drizzle'),
    (53, 'Drizzle: moderate',                 'drizzle'),
    (55, 'Drizzle: dense',                    'drizzle'),
    (56, 'Freezing drizzle: light',           'freezing-rain'),
    (57, 'Freezing drizzle: dense',           'freezing-rain'),
    (61, 'Rain: slight',                      'rain'),
    (63, 'Rain: moderate',                    'rain'),
    (65, 'Rain: heavy',                       'rain'),
    (66, 'Freezing rain: light',              'freezing-rain'),
    (67, 'Freezing rain: heavy',              'freezing-rain'),
    (71, 'Snow fall: slight',                 'snow'),
    (73, 'Snow fall: moderate',               'snow'),
    (75, 'Snow fall: heavy',                  'snow'),
    (77, 'Snow grains',                       'snow'),
    (80, 'Rain showers: slight',              'showers'),
    (81, 'Rain showers: moderate',            'showers'),
    (82, 'Rain showers: violent',             'showers'),
    (85, 'Snow showers: slight',              'snow-showers'),
    (86, 'Snow showers: heavy',               'snow-showers'),
    (95, 'Thunderstorm: slight or moderate',  'thunderstorm'),
    (96, 'Thunderstorm with slight hail',     'thunderstorm'),
    (99, 'Thunderstorm with heavy hail',      'thunderstorm');