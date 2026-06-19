import requests 

def getGeoData(ip: str):
    
    data = requests.get(
        f"http://ip-api.com/json/{ip}",
        timeout=2,
    ).json() 
    
    return data
