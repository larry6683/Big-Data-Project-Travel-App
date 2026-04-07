from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class Saved_Trips_Page:
    
    saved_trip_count_selector = (By.XPATH, '//*[@id="saved-trips-count"]')
    delete_trip_selector = (By.XPATH, 'btn-delete-trip-1')
    first_flight_selector = (By.XPATH, '//*[@id="flight-select-0"]')
    first_stay_selector = (By.XPATH, '//*[@id="stay-select-0"]')
    first_attraction_selector = (By.XPATH, '//*[@id="attraction-select-0"]')
    first_tour_selector = (By.XPATH, '//*[@id="tour-select-0"]')
    generate_itinerary_btn_selector = (By.XPATH, "//button[contains(@id, 'generate_itinerary_btn')]")
    
    flight_tab_selector = (By.XPATH, '//*[@id="tab-button-flights"]')
    stays_tab_selector = (By.XPATH, '//*[@id="tab-button-stays"]')
    attractions_tab_selector = (By.XPATH, '//*[@id="tab-label-attractions"]')
    tours_tab_selector = (By.XPATH, '//*[@id="tab-icon-tours"]')
    
    close_itinerary_btn_selector = (By.XPATH, '//*[@id="close-itinerary-modal-btn"]')
    saved_trips_btn_selector = (By.XPATH, '//*[@id="save-trip-btn"]')
    
    def click_flight_tab(self, driver):
        WebDriverWait(driver, 30).until(EC.element_to_be_clickable(self.flight_tab_selector)).click()
        
    def click_stays_tab(self, driver):
        WebDriverWait(driver, 10).until(EC.element_to_be_clickable(self.stays_tab_selector)).click()
        
    def click_attractions_tab(self, driver):
        WebDriverWait(driver, 10).until(EC.element_to_be_clickable(self.attractions_tab_selector)).click()
        
    def click_tours_tab(self, driver):
        WebDriverWait(driver, 10).until(EC.element_to_be_clickable(self.tours_tab_selector)).click()
    
    def click_itin_button(self, driver):
        WebDriverWait(driver, 10).until(EC.element_to_be_clickable(self.generate_itinerary_btn_selector)).click()
        
    def click_save_trip_button(self, driver):
        WebDriverWait(driver, 10).until(EC.element_to_be_clickable(self.saved_trips_btn_selector)).click()
        
    def click_close_itinerary_button(self, driver):
        WebDriverWait(driver, 10).until(EC.element_to_be_clickable(self.close_itinerary_btn_selector)).click()
    
    def get_saved_trip_count(self, driver):
        element = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located(self.saved_trip_count_selector)
        )
        return element.text
    
    def delete_first_saved_trip(self, driver):
        delete_btn = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable(self.delete_trip_selector)
        )
        delete_btn.click()
        Keys.ENTER
        
    def select_first_flight(self, driver):
        self.click_flight_tab(driver)
        flight_btn = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable(self.first_flight_selector)
        )
        flight_btn.click()
        
    def select_first_stay(self, driver):
        self.click_stays_tab(driver)
        stay_btn = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable(self.first_stay_selector)
        )
        stay_btn.click()
        
    def select_first_attraction(self, driver):
        self.click_attractions_tab(driver)
        attraction_btn = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable(self.first_attraction_selector)
        )
        attraction_btn.click()
        
    def select_first_tour(self, driver):
        self.click_tours_tab(driver)
        tour_btn = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable(self.first_tour_selector)
        )
        tour_btn.click()
        
        
    def switch_to_saved_trips_tab(self, driver):
        profile_btn = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, "profile_username"))
        )
        profile_btn.click()
        
        saved_trips_btn = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, "saved_trip_link"))
        )
        saved_trips_btn.click()