from playwright.sync_api import sync_playwright

def get_links_playwright(target_url):
    with sync_playwright() as p:
        # Launch a headless browser
        browser = p.chromium.launch(headless=True)
        # Using a context with a realistic user agent
        context = browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36")
        page = context.new_page()
        
        # Go to the website
        print(f"Navigating to {target_url}...")
        page.goto(target_url, wait_until="networkidle")
        
        # Use .evaluate() to run the script in the browser's context
        # This returns the list directly to Python
        links = page.evaluate("() => Array.from(document.querySelectorAll('a')).map(a => a.href)")
        
        browser.close()
        
        # Filter to keep only unique, valid HTTP/HTTPS links
        unique_links = sorted(list(set(link for link in links if link.startswith('http'))))
        return unique_links

# Example usage
URL = "https://www.wikipedia.org"
found_links = get_links_playwright(URL)

print(f"Found {len(found_links)} unique links.")
with open("links.txt", "w") as f:
    for link in found_links:
        f.write(link + "\n")