import axios from "axios";

export const createShortLink = async (longUrl: string) => {
    const response = await axios.post(
        "http://localhost:8000/v1/links", 
        {
            longUrl,
        },
    ); 

    return response.data;
};