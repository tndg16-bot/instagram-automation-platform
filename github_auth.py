import asyncio
from playwright.async_api import async_playwright

async def github_auth():
    code = "7C97-7161"
    url = "https://github.com/login/device"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        
        await page.goto(url)
        
        print(f"Navigated to {url}")
        
        await page.wait_for_timeout(5000)
        
        print(f"Current URL: {page.url}")
        
        try:
            title = await page.title()
            print(f"Page title: {title.encode('utf-8', errors='ignore').decode('utf-8')}")
        except:
            print("Could not retrieve page title")
        
        try:
            code_input = await page.query_selector('input[name="code"]')
            
            if code_input:
                print("Found code input field. Entering code...")
                await code_input.fill(code)
                print(f"Entered code: {code}")
                
                continue_button = await page.query_selector('button[type="submit"]')
                if continue_button:
                    await continue_button.click()
                    print("Clicked Continue button")
            else:
                print("Code input field not found. You may need to login first.")
                print("Please complete the login process in the browser window.")
        except Exception as e:
            print(f"Error: {e}")
            print("Please complete the login process in the browser window.")
        
        print("Please complete the authentication in the browser...")
        print("The browser will remain open for you to complete the login.")
        
        await page.wait_for_timeout(300000)
        
        await browser.close()
        print("Authentication completed and browser closed")

if __name__ == "__main__":
    asyncio.run(github_auth())
