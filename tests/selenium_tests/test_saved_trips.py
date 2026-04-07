from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import pytest
from pageobjects.search import searchPage
from pageobjects.saved_trips import Saved_Trips_Page

@pytest.mark.usefixtures("login")
class Test_Frontend_Login():
    @pytest.fixture(autouse=True)
    def setup_method(self, login):
        self.driver = login
        self.search_page=searchPage()
        self.saved_trip_page = Saved_Trips_Page()
        
    def search_for_trip(self):
        self.search_page.enter_source(self.driver, "New York, New York")
        self.search_page.enter_destination(self.driver, "Denver, Colorado")
        self.search_page.set_dates(self.driver, "Choose Saturday, April 25th, 2026", "Choose Thursday, April 30th, 2026")
        self.search_page.click_submit(self.driver)
        
    def select_itinerary(self):
        self.saved_trip_page.select_first_flight(self.driver)
        self.saved_trip_page.select_first_attraction(self.driver)
        self.saved_trip_page.select_first_stay(self.driver)
        self.saved_trip_page.select_first_tour(self.driver)
        
    def generate_itinerary(self):
        self.search_for_trip()
        self.select_itinerary()
        self.saved_trip_page.click_itin_button(self.driver)
        self.saved_trip_page.click_save_trip_button(self.driver)
        self.saved_trip_page.click_close_itinerary_button(self.driver)
                
    def test_search(self):
        expected_result = "You have 1 stored trips."
        self.generate_itinerary()
        self.saved_trip_page.switch_to_saved_trips_tab(self.driver)
        
        saved_trip_count = self.saved_trip_page.get_saved_trip_count(self.driver)
        
        assert saved_trip_count == expected_result, \
            f"Expected saved trip count to be '{expected_result}', but got '{saved_trip_count}'"
            
    def delete_trip(self):
        self.saved_trip_page.delete_first_saved_trip(self.driver)
        expected_result = "You have 0 stored trips."
        
        saved_trip_count = self.saved_trip_page.get_saved_trip_count(self.driver)
        
        assert saved_trip_count == expected_result, \
            f"Expected saved trip count to be '{expected_result}', but got '{saved_trip_count}'"
    
        
        
        
        
        
        
        
        
        