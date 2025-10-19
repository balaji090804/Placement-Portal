const API_URL = "http://localhost:8080/api";

export const fetchUserData = async () => {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            console.error("Failed to fetch user data");
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
};
