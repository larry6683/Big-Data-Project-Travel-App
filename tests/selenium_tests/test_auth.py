from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import pytest
from conftest import webdriver_handler, login
from pageobjects.auth_path import AuthPage
from test_variables import test_variables

@pytest.mark.usefixtures("login")
@pytest.mark.regression
class Test_Frontend_Login():
    @pytest.fixture(autouse=True)
    def setup_method(self, login):
        self.driver = login
    
    @pytest.mark.smoke
    def test_login_success(self, login):
        expected_url = test_variables.test_url
        WebDriverWait(self.driver, 5).until(
            EC.url_to_be(expected_url),
            message=f"Expected URL to be {expected_url} within 5s, but was {self.driver.current_url}"
        )
    
    @pytest.mark.smoke
    def test_profile_page(self):
        profile_btn = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.ID, "profile_username"))
        )
        profile_btn.click()
        
        profile_lnk = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.ID, "profile_link"))
        )
        profile_lnk.click()
        
        username_element = WebDriverWait(self.driver, 10).until(
            EC.visibility_of_element_located((By.ID, "header-display-name"))
        )
        
        username = username_element.text
        
        assert username == test_variables.name_test_user, \
            f"Expected username: {test_variables.name_test_user}, but got: {username}"
            
    @pytest.mark.usefixtures("logout")
    @pytest.mark.usefixtures("login")
    def test_login_invalid_credentials(self):
        auth_page = AuthPage()
        
        auth_page.click_signin_toggle(self.driver)
        
        auth_page.enter_email(self.driver, "fake_user@example.com")
        auth_page.enter_password(self.driver, "WrongPassword123!")
        auth_page.click_submit(self.driver)
        
        error_message_element = WebDriverWait(self.driver, 5).until(
            EC.visibility_of_element_located((By.ID, "error-message"))
        )
        
        assert "Incorrect email or password" in error_message_element.text, \
            f"Expected error message not found. Got: {error_message_element.text}"
        
@pytest.mark.regression
@pytest.mark.usefixtures("webdriver_handler")
class Test_Signup():
    @pytest.fixture(autouse=True)
    def setup_method(self, webdriver_handler):
        self.driver = webdriver_handler
        
    @pytest.mark.smoke
    def test_signup_success(self):
        auth_page = AuthPage()
        
        auth_page.click_signup_toggle(self.driver)
        
        auth_page.enter_name(self.driver, "Automated Tester")
        dynamic_email = f"newuser_{int(time.time())}@example.com"
        
        auth_page.enter_email(self.driver, dynamic_email)
        auth_page.enter_password(self.driver, "SecurePassword123!")
        auth_page.click_submit(self.driver)
        
        expected_url = test_variables.test_url
        WebDriverWait(self.driver, 5).until(
            EC.url_to_be(expected_url),
            message=f"Expected URL to be {expected_url} within 5s, but was {self.driver.current_url}"
        )
    