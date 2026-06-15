import requests 

def getGeoData(ip: str):
    
    data = requests.get(
        f"http://ip-api.com/json/{ip}"
    ).json() 
    
    return data