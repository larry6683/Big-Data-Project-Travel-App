import sys
from selenium.webdriver.common.keys import Keys
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class searchPage:
    
    source_selector = (By.XPATH, '//input[@placeholder="eg. NEW YORK, NY"]')
    destination_selector = (By.XPATH, '//input[@placeholder="eg. LOS ANGELES, CA"]')
    travel_start_date_selector = (By.XPATH, '//input[@placeholder="Start..."]')
    travel_end_date_selector = (By.XPATH, '//input[@placeholder="End..."]')
    
    budget_selector = (By.XPATH, "//button[contains(text(), 'Budget')]")
    luxury_selector = (By.XPATH, "//button[contains(text(), 'Luxury')]")
    fly_selector = (By.XPATH, "//button[contains(text(), 'Fly')]")
    drive_selector = (By.XPATH, "//button[contains(text(), 'Drive')]")
    submit_selector = (By.XPATH, '//*[@id="submit-side"]')
    drive_text_selector = (By.XPATH, "//div[@id='drive_text']")
    destination_error_text_selector = (By.XPATH, "//span[@id='destination_error']")
    start_date_error_text_selector = (By.XPATH, "//span[@id='start_date_error']")
    
    error_selector = (By.ID, "error-message")
    
    options_label_selector = (By.ID, "options_selector")
    
    def enter_source(self, driver, location):
        el = WebDriverWait(driver, 10).until(EC.element_to_be_clickable(self.source_selector))
        el.send_keys(location + Keys.ENTER)
        first_result_xpath = "//ul[contains(@class, 'max-h-[185px]')]//li[1]"
    
        try:
            first_option = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, first_result_xpath))
            )
            first_option.click()
            
        except Exception as e:
            print(f"Dropdown did not appear or result not found: {e}")

    def enter_destination(self, driver, location):
        el = WebDriverWait(driver, 10).until(EC.element_to_be_clickable(self.destination_selector))
        el.send_keys(location + Keys.ENTER)
        first_result_xpath = "//ul[contains(@class, 'max-h-[185px]')]//li[1]"
    
        try:
            first_option = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, first_result_xpath))
            )
            first_option.click()
            
        except Exception as e:
            print(f"Dropdown did not appear or result not found: {e}")
            
    def select_date_from_ui(self, driver, date_input_selector, target_day):
        """
        Clicks the input to open the calendar, then clicks the specific day.
        target_day should be a string, e.g., "17"
        """
        input_field = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable(date_input_selector)
        )
        input_field.click()
        day_xpath = f"//div[@aria-label='{target_day}']"
        
        day_element = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, day_xpath))
        )
        day_element.click()

    def set_dates(self, driver, start_day, end_day):
        self.select_date_from_ui(driver, self.travel_start_date_selector, start_day)
        self.select_date_from_ui(driver, self.travel_end_date_selector, end_day)

    def select_budget_type(self, driver, mode="budget"):
        """Selects either Budget or Luxury"""
        selector = self.budget_selector if mode.lower() == "budget" else self.luxury_selector
        WebDriverWait(driver, 10).until(EC.element_to_be_clickable(selector)).click()

    def select_travel_mode(self, driver, mode="fly"):
        """Selects either Fly or Drive"""
        selector = self.fly_selector if mode.lower() == "fly" else self.drive_selector
        WebDriverWait(driver, 10).until(EC.element_to_be_clickable(selector)).click()

    def click_submit(self, driver):
        WebDriverWait(driver, 30).until(EC.element_to_be_clickable(self.submit_selector)).click()
        
    def is_options_label_displayed(self, driver):
        """Returns True if the options label is visible on the screen"""
        try:
            WebDriverWait(driver, 30).until(EC.visibility_of_element_located(self.options_label_selector))
            return True
        except:
            return False

    def is_destination_error_displayed(self, driver):
        """Returns True if the destination error message is visible on the screen"""
        try:
            WebDriverWait(driver, 10).until(EC.visibility_of_element_located(self.destination_error_text_selector))
            return True
        except:
            return False

    def get_options_text(self, driver):
        """Returns the actual text of the label for detailed assertion"""
        element = WebDriverWait(driver, 10).until(EC.visibility_of_element_located(self.options_label_selector))
        return element.text
    
    
    def is_drive_text_displayed(self, driver):
        """Returns True if the drive text is visible on the screen (used for verifying Drive mode)"""
        try:
            WebDriverWait(driver, 10).until(EC.visibility_of_element_located(self.drive_text_selector))
            return True
        except:
            return False
        
    def is_start_date_error_displayed(self, driver):
        """Returns True if the start date error message is visible on the screen"""
        try:
            WebDriverWait(driver, 10).until(EC.visibility_of_element_located(self.start_date_error_text_selector))
            return True
        except:
            return False
    
    
    def get_error_message(self, driver):
        """Attempts to find an error message on the screen and returns its text"""
        try:
            # Adjust the timeout to be short so the test fails fast if no error exists
            element = WebDriverWait(driver, 3).until(
                EC.visibility_of_element_located(self.error_selector)
            )
            return element.text
        except:
            return ""