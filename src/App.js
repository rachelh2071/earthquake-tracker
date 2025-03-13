import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const API_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson";

function App() {
  const [earthquakes, setEarthquakes] = useState([]);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [timeframe, setTimeframe] = useState("day");
  const [searchError, setSearchError] = useState(null);

  // Fetch top 10 strongest earthquakes for a timeframe
  const fetchEarthquakes = useCallback(async (selectedTimeframe) => {
    setError(null);
    setSearchError(null);
    setTimeframe(selectedTimeframe);
    setQuery(""); // Clear search when timeframe button is clicked

    try {
      const response = await axios.get(`${API_URL}&starttime=${getTimeframe(selectedTimeframe)}&orderby=magnitude&limit=10`);
      console.log("Fetched data:", response.data);

      const sortedEarthquakes = response.data.features.sort((a, b) => new Date(a.properties.time) - new Date(b.properties.time));
      setEarthquakes(sortedEarthquakes);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load earthquake data. Please try again.");
    }
  }, []);

  useEffect(() => {
    fetchEarthquakes("day");
  }, [fetchEarthquakes]);

  // Get start time for timeframe queries
  const getTimeframe = (selectedTimeframe) => {
    const now = new Date();
    let past = new Date();
    if (selectedTimeframe === "hour") past.setHours(now.getHours() - 1);
    if (selectedTimeframe === "day") past.setDate(now.getDate() - 1);
    if (selectedTimeframe === "week") past.setDate(now.getDate() - 7);
    console.log("Timeframe start date:", past.toISOString());
    return past.toISOString();
  };

  // Fetch earthquakes for a specific location (past year)
  const searchByLocation = async () => {
    if (!query.trim()) return;

    setError(null);
    setSearchError(null);
    setTimeframe(""); // Clear timeframe when searching

    try {
      const response = await axios.get(`${API_URL}&starttime=${getPastYear()}&limit=1000`);
      console.log("Fetched data:", response.data);

      const filtered = response.data.features.filter(eq =>
        eq.properties.place.toLowerCase().includes(query.toLowerCase())
      );

      if (filtered.length === 0) {
        setSearchError(`No earthquakes found in "${query}" for the past year.`);
      }

      setEarthquakes(filtered);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to load earthquake data. Please try again.");
    }
  };

  // Get past year date string
  const getPastYear = () => {
    const now = new Date();
    now.setFullYear(now.getFullYear() - 1);
    return now.toISOString();
  };

  // Get dynamic title based on timeframe or search
  const getTitle = () => {
    if (query) {
      return `Earthquakes in the last year in "${query}"`;
    }
    const timeframeText = timeframe === "hour" ? "Last Hour" : timeframe === "day" ? "Last Day" : "Last Week";
    return `Top 10 Strongest Earthquakes in the ${timeframeText}`;
  };

  // Chart data
  const chartData = {
    labels: earthquakes.map(eq => new Date(eq.properties.time).toLocaleString()),
    datasets: [
      {
        label: "Magnitude",
        data: earthquakes.map(eq => eq.properties.mag),
        borderColor: "#007BFF",
        backgroundColor: "rgba(0, 123, 255, 0.5)",
        fill: true,
      },
    ],
  };

  // Chart options (axis labels)
  const chartOptions = {
    scales: {
      x: {
        title: {
          display: true,
          text: "Time of Earthquake",
        },
      },
      y: {
        title: {
          display: true,
          text: "Magnitude",
        },
      },
    },
  };

  return (
    <div style={{ textAlign: "center", padding: "20px", fontFamily: "Arial, sans-serif", backgroundColor: "#f4f4f4", minHeight: "100vh" }}>
      <h1 style={{ color: "#333" }}>🌍 Earthquake Tracker</h1>

      {/* Buttons for timeframe selection */}
      <div style={{ marginBottom: "20px" }}>
        <button style={buttonStyle} onClick={() => fetchEarthquakes("hour")}>Last Hour</button>
        <button style={buttonStyle} onClick={() => fetchEarthquakes("day")}>Last Day</button>
        <button style={buttonStyle} onClick={() => fetchEarthquakes("week")}>Last Week</button>
      </div>

      {/* Search input */}
      <div>
        <input
          type="text"
          placeholder="Search by location (past year)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={inputStyle}
        />
        <button style={searchButtonStyle} onClick={searchByLocation}>Search</button>
      </div>

      {/* Error messages */}
      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}
      {searchError && <p style={{ color: "red", fontWeight: "bold" }}>{searchError}</p>}

      {/* Display earthquakes */}
      {earthquakes.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h2>{getTitle()}</h2>
          <ul style={listStyle}>
            {earthquakes.map(eq => (
              <li key={eq.id} style={listItemStyle}>
                <strong>{eq.properties.place}</strong> - Magnitude: {eq.properties.mag} - Time: {new Date(eq.properties.time).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Chart */}
      <div style={{ width: "90%", margin: "20px auto", height: "500px" }}>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}

// Styles
const buttonStyle = {
  margin: "5px",
  padding: "10px 15px",
  border: "none",
  backgroundColor: "#007BFF",
  color: "white",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "16px"
};

const searchButtonStyle = {
  ...buttonStyle,
  marginLeft: "5px",
  backgroundColor: "#28A745",
};

const inputStyle = {
  padding: "10px",
  margin: "10px 5px",
  border: "1px solid #ccc",
  borderRadius: "5px",
  fontSize: "16px"
};

const listStyle = {
  listStyle: "none",
  padding: 0,
  marginTop: "20px"
};

const listItemStyle = {
  backgroundColor: "white",
  padding: "10px",
  margin: "10px auto",
  width: "60%",
  borderRadius: "5px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
};

export default App;
