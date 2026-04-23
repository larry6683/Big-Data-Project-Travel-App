from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import pytest
from pageobjects.search import searchPage

@pytest.mark.usefixtures("login")
@pytest.mark.regression
class Test_Frontend_Login():
    @pytest.fixture(autouse=True)
    def setup_method(self, login):
        self.driver = login
        self.search_page=searchPage()
        
    @pytest.mark.smoke        
    def test_search(self):
        self.search_page.enter_source(self.driver, "New York, New York")
        self.search_page.enter_destination(self.driver, "Denver, Colorado")
        self.search_page.set_dates(self.driver, "Choose Saturday, April 25th, 2026", "Choose Thursday, April 30th, 2026")
        self.search_page.click_submit(self.driver)
        assert self.search_page.is_options_label_displayed(self.driver), "Expected options label to be visible after search, but it was not."
    
    def test_search_Premium_drive_options(self):
        """Tests that changing the default toggles still yields a successful search"""
        self.search_page.enter_source(self.driver, "Chicago, Illinois")
        self.search_page.enter_destination(self.driver, "Miami, Florida")
        
        self.search_page.set_dates(self.driver, "Choose Saturday, May 2nd, 2026", "Choose Thursday, May 14th, 2026")
        
        self.search_page.select_budget_type(self.driver, mode="Premium")
        self.search_page.select_travel_mode(self.driver, mode="drive")
        
        self.search_page.click_submit(self.driver)
        
        assert self.search_page.is_drive_text_displayed(self.driver), \
            "Expected options label to be visible after Premium/Drive search."

    def test_search_same_source_and_destination(self):
        """Negative Test: App should block searching for the exact same city"""
        self.search_page.enter_source(self.driver, "Boston, Massachusetts")

        self.search_page.enter_destination(self.driver, "Boston, Massachusetts")
        
        self.search_page.set_dates(self.driver, "Choose Saturday, April 25th, 2026", "Choose Thursday, April 30th, 2026")
        self.search_page.click_submit(self.driver)
        
        assert self.search_page.is_destination_error_displayed(self.driver), \
            "Search should not have succeeded with identical source and destination!"

    def test_search_missing_dates(self):
        """Negative Test: App should block submission if dates are missing"""
        self.driver.refresh()
        self.search_page.enter_source(self.driver, "Seattle, Washington")
        self.search_page.enter_destination(self.driver, "Portland, Oregon")
        
        self.search_page.click_submit(self.driver)
        
        assert self.search_page.is_start_date_error_displayed(self.driver), \
            "Search allowed submission without travel dates!"