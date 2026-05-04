export interface WeatherData {
    icon: string;
    desc: string;
    temp: number;
    humidity: number;
    wind: number;
}

const CACHE_TIME = 20 * 60 * 1000;

function getWeatherEmoji(main: string | undefined) {
    switch (main) {
        case "Clear":
            return "☀️";
        case "Clouds":
            return "☁️";
        case "Rain":
            return "🌧️";
        case "Thunderstorm":
            return "⛈️";
        case "Drizzle":
            return "🌦️";
        case "Snow":
            return "❄️";
        case "Mist":
        case "Fog":
        case "Haze":
            return "🌫️";
        default:
            return "🌤️";
    }
}

export async function fetchWeatherByCity(city: string): Promise<WeatherData> {
    const key = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

    if (!key) {
        throw new Error("Missing OpenWeather API key");
    }

    const cleanedCity = city.trim();

    if (!cleanedCity) {
        throw new Error("City is empty");
    }

    const cacheKey = `weather_${cleanedCity.toLowerCase()}`;

    if (typeof window !== "undefined") {
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
            const parsed = JSON.parse(cached);

            if (Date.now() - parsed.savedAt < CACHE_TIME) {
                return parsed.data;
            }
        }
    }

    const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
            cleanedCity
        )}&appid=${key}&units=metric`
    );

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Weather fetch failed: ${res.status} ${text}`);
    }

    const data = await res.json();

    const weather: WeatherData = {
        icon: getWeatherEmoji(data.weather?.[0]?.main),
        desc: data.weather?.[0]?.description ?? "Weather",
        temp: Math.round(data.main.temp),
        humidity: data.main.humidity,
        wind: Math.round(data.wind.speed * 3.6),
    };

    if (typeof window !== "undefined") {
        localStorage.setItem(
            cacheKey,
            JSON.stringify({
                savedAt: Date.now(),
                data: weather,
            })
        );
    }

    return weather;
}