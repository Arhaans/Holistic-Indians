import React, { useState, useEffect } from "react";
import axios from "axios"; // Import Axios for API requests
import "./App.css";
import HolisticLogo from "./holisticLogo.svg"; // Ensure the logo file is in the `src` folder
import sendimage from "./send-svgrepo-com.svg";

function App() {
  const [query, setQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState([]);
  const [results, setResults] = useState([]); // Stores all search results
  const [typingEffect, setTypingEffect] = useState(""); // For smooth typing effect

  // Backend URL
  const BACKEND_URL = " https://3ece-193-60-231-109.ngrok-free.app/predict";

  // Load search history from localStorage
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("searchHistory")) || [];
    setSearchHistory(history);
  }, []);

  // Typing Effect for Heading
  useEffect(() => {
    const text = "What can I help with?";
    let index = -1;
    const interval = setInterval(() => {
      if (index < text.length-1) {
        setTypingEffect((prev) => prev + text[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 100); // Adjust typing speed here
    return () => clearInterval(interval);
  }, []);

  // Handle search action
  const handleSearch = async () => {
    if (query.trim() === "") return;

    try {
      // Make a POST request to the backend
      const response = await axios.post(BACKEND_URL, {
        text: query,
      });

      // Extract the response data
      const resultMessage = response.data.message || "No result found.";
      const updatedHistory = [...searchHistory, query];
      
      // Update states
      setSearchHistory(updatedHistory); // Update search history
      setResults((prevResults) => [...prevResults, resultMessage]); // Add new result
      localStorage.setItem("searchHistory", JSON.stringify(updatedHistory)); // Save history
      setQuery(""); // Clear the input
    } catch (error) {
      console.error("Error fetching from backend:", error);
      const errorMessage =
        error.response?.data?.detail || "Failed to connect to backend.";
      setResults((prevResults) => [
        ...prevResults,
        `Error for "${query}": ${errorMessage}`,
      ]);
    }
  };

  // Handle history item deletion
  const handleDeleteHistory = (index) => {
    const updatedHistory = searchHistory.filter((_, i) => i !== index);
    setSearchHistory(updatedHistory);
    localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-poppins">
      <div className="flex flex-grow">
        {/* Sidebar (Visible only after the first search) */}
        {results.length > 0 && (
          <div className="w-1/4 bg-indigo-50 p-4 shadow-md">
            <div className="flex items-center mb-6">
              <img src={HolisticLogo} alt="Holistic AI Logo" className="h-10 mr-3" />
            </div>
            <h3 className="text-lg font-semibold text-indigo-400 mb-6">Search History</h3>
            <ul className="space-y-3">
              {searchHistory.length > 0 ? (
                searchHistory.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between p-3 bg-white shadow-sm rounded-lg hover:bg-indigo-100 transition duration-200"
                  >
                    <span
                      className="cursor-pointer text-indigo-800"
                      onClick={() =>
                        setResults((prevResults) => [...prevResults, `Result for "${item}"`])
                      }
                    >
                      {item}
                    </span>
                    <button
                      className="text-gray-500 hover:text-red-500 transition duration-200"
                      onClick={() => handleDeleteHistory(index)}
                    >
                      ✖
                    </button>
                  </li>
                ))
              ) : (
                <p className="text-gray-600">No history available.</p>
              )}
            </ul>
          </div>
        )}

        {/* Main Content */}
        <div
          className={`flex-1 flex flex-col items-center justify-center ${
            results.length > 0 ? "p-8" : ""
          }`}
        >
          <header className="text-center">
            <img src={HolisticLogo} alt="Holistic AI Logo" className="h-16 mb-10 text-center" />
          </header>
          {results.length === 0 && (
            <h1 className="text-xl font-light mb-6 text-gray-800 gradient-text">
              {typingEffect || " "}
            </h1>
          )}

          {results.length > 0 && (
            <div className="w-full max-w-3xl space-y-4 mb-6">
              {results.map((result, index) => (
                <div key={index} className="bg-indigo-50 p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-bold text-indigo-800">Search Result</h3>
                  <p className="text-gray-800 mt-2">{result}</p>
                </div>
              ))}
            </div>
          )}

          {/* Search Input */}
          <div className="flex items-center w-full max-w-3xl bg-gray-100 p-4 rounded-full shadow-md">
            <input
              type="text"
              placeholder="Ask Holistic"
              className="flex-grow bg-transparent outline-none text-gray-700 px-4"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress} // Added keypress handler
            />
            <button
              className="flex items-center justify-center w-10 h-10 p-1"
              onClick={handleSearch}
            >
              <img src={sendimage} alt="Send" className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center p-4 bg-gray-100 shadow-inner">
        <p className="text-sm text-gray-600">
          Powered by <strong>Holistic Indians</strong> © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

export default App;
