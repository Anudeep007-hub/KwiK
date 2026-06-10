def getBase62(uniqueID):
    STRING = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ" 
    BASE = 62
    
    ans = []
    while uniqueID:
        ans.append(STRING[uniqueID%BASE])
        uniqueID //= BASE 
    
    return "".join(ans[::-1])