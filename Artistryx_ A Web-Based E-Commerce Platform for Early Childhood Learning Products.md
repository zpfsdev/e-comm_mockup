# E-COMM

# Project Proposal

**1\. Project Title:** Artistryx: A Web-Based E-Commerce Platform for Early Childhood Learning Products											  
**2\. Background and Rationale**   
	 With growing concerns about excessive digital screen time among young children and limited access to physical stores, the Artistryx E-Commerce Platform provides convenient access to age-appropriate, hands-on learning products, particularly for customers in outlying areas.  
**3\. Project Objectives**  
**General Objective:**  
To develop a user-friendly e-commerce website for selling a diverse range of hands-on learning materials for children, ensuring an easy buying process that supports different developmental needs.  
**Specific Objectives:**

1. To implement a complete e-commerce transaction system, including product browsing, cart management, and payment.  
2. To develop a secure user authentication and role-based system that allows customers to manage purchases, sellers to manage their products, and administrators to oversee platform operations and manage user accounts.

**4\. Target Beneficiaries**  
**Primary Beneficiaries:**

* Customers (Parents/Educators) \- browse and purchase hands-on learning materials.  
* Sellers \- showcase products to a wider audience.  
* Administrators \- oversee platform operations and manage user accounts for smooth operation.

**5\. Project Description and Scope**   
The proposed project is a web-based e-commerce platform designed for early childhood learning products. It enables customers to browse, search, and purchase educational items using a supported payment option. The platform also features user accounts, a shopping cart, order tracking, administrative management, and basic security and access control mechanisms. However, the platform does not support AI chatbot support or voucher and coupon systems.  
**6\. Implementation Plan**  
The project will be implemented following a phased approach to ensure a systematic and efficient development process.

* Phase 1: Defining Concepts and Requirements  
* Phase 2: Data Organization Structuring  
* Phase 3: Platform Design and Layout  
* Phase 4: Platform Development   
* Phase 5: Testing  
* Phase 6: Deployment, Training, and Maintenance

**7\. Expected Outputs and Outcomes**  
**Expected Outputs:**

* Fully functional and user-friendly e-commerce platform.  
* Secure shopping environment and transaction processing.

**Outcomes:**

* Convenient access to hands-on learning materials.  
* Wider market reach.

**8\. Sustainability Considerations**  
	The project will be sustained after initial implementation through revenue from platform commission. This fund will support platform maintenance and updates to ensure reliability. In addition, administrator training and the user manual will facilitate smooth and efficient operation.

# Gantt Chart

\[LAB ACTIVITY\] For today’s activity, please create a Gantt Chart for your Project.

Format:

* Up to 2 levels for the activities  
* Indicate weeks for the duration  
* Another column for the proponents involved in the activity

\* This is not part of your deliverables. BUT, I want you to be guided by the timelines for your entire project lifecycle.

Submission will be done F2F (during the next consultation/checking of your deliverables)

E-Commerce Project Proposal 

* Defining Scope and Objectives  
* Get approval from advisor

Software Requirements Specifications

* Identify functional and non-functional requirements  
* Draft SRS  
* Review and finalize SRS

Database Design (ERD/Class Diagram)

* Identify entities and attributes  
* Draft ERD/Class Diagram  
* Finalize ERD/Class Diagram

Function UI/UX Design

* Create Low-Fidelity Wireframes  
* Create High-Fidelity Wireframes


System Development

* Front-end Development  
* Back-end Development  
* Integration


Testing

* Unit testing  
* Integration testing  
* System testing


Final Project Presentation

* Prepare user manual  
* Final system check and polishing  
* Prepare presentation slides  
* Final demo


# SRS/Project Requirements

**SOFTWARE REQUIREMENTS SPECIFICATION (SRS)**  
**E-Commerce Web/Mobile System**

**1\. Introduction**  
1.1 Purpose  
	This document describes the requirements of Artistryx, a web-based e-commerce platform for early childhood learning products. The platform allows parents and educators to browse and purchase age-appropriate hands-on learning products that support different developmental needs. It also provides sellers with a platform to expand their market reach, while administrators manage platform operations and user accounts to ensure a smooth and efficient operation.  
1.2 Scope  
	The platform covers the following:

* Online product browsing \- Users can browse and search age-appropriate hands-on learning products.  
* Ordering and checkout \- Users can add products to their shopping cart and complete purchases.   
* Payment recording \- User’s payments are recorded after checkout but status remains unpaid until payment via cash-on-delivery is completed.  
* Order tracking \- Users can monitor the status of their orders which are updated by the sellers.  
* Seller product management \- Sellers can add, update, and remove their own products from the platform.  
* Admin user management \- Administrators can oversee the platform operation and manage user accounts for smooth operation.  
  The platform does not cover the following:  
* AI chatbot \- No AI support for customer service is included.  
* Voucher and coupon system \- Discounts and vouchers are not supported.  
* Product storage and delivery \- Product storage, handling, and delivery are managed by the sellers. The platform only provides the stage for listing, browsing, and purchasing of products. 

1.3 Intended Users

* Customers (Parents/Educators) \- These users browse and purchase hands-on learning products. They use the platform to search for products, add items to their shopping cart, make payments, and track the status of their orders.  
* Sellers \- These users list and manage their products on the platform. They use the platform to showcase their products to a wider audience.  
* Administrators \- These users oversee platform operation and manage user accounts to ensure smooth operation.

1.4 Definitions

* Cart \- temporary list of items to purchase  
* Cash-on-delivery \- payment method where the customer pays for the product at the time of delivery  
* Checkout \- confirmation of purchase  
* Order \- confirmed transaction  
* Payment \- processing of the purchase  
* Platform \- stage for listing, browsing, and purchasing of products  
* Product \- hands-on learning item listed on the platform available for purchase  
* Search \- to find products  
* Track \- to monitor the status of a purchased order

**2\. Overall Description**  
2.1 System Overview  
	Users must first create an account to access the Artistryx platform. They can browse and search for products, add items to their shopping cart, choose cash-on-delivery as payment method, proceed to checkout, and have the order recorded in the platform with an unpaid status until payment is completed. Users who wish to sell their products can register as sellers and list, update, and remove their products on the platform.

2.2 System Features (High Level)

* User registration/login \- User must register/login to access the platform.  
* Product catalog \- Customers can browse and search for age-appropriate hands-on learning products.  
* Shopping cart \- Users can add or remove items from 	their cart, update quantities, and choose items before checkout.  
* Checkout \- Confirms the purchase of the selected product and the order is recorded in the platform.  
* Payment recording \- Payment is recorded upon checkout, but status remains unpaid until payment via cash-on-delivery is made.  
* Order tracking \- Customers can monitor the status of their order.  
* Admin dashboard \- Allows admin to manage user accounts.  
* Seller dashboard \- Allows sellers to list, update, and remove their product from the platform.   
* Reports \- Sellers can view sales reports of their products.

2.3 User Roles  
**Role			Description**  
Customer		Browses and buys products  
Seller			Lists and manages products and orders  
Admin			Oversees platform operations and manages user accounts  
2.4 Operating Environment

* Web browser \- Users can access the platform using modern browsers such as Chrome, Edge, or Firefox.    
* Internet connection required \- Required for performing actions and interacting with the platform.  
* Server \+ Database \- The platform runs on a server using NestJS with Prisma and SQL database.

2.5 Assumptions

* Users have internet access \- Users are required to have internet access to perform operations within the platform such as browsing, searching, and purchasing products.  
* Payment is via COD \- Cash-on-delivery is the only payment method available. 

**3\. Functional Requirements**  
3.1 User Account Management

* FR-01: The system shall allow users to register.  
* FR-02: The system shall allow users to log in.  
* FR-03: The system shall allow users to log out.  
* FR-04: The system shall allow users to update their profile.  
* FR-05: The system shall restrict access to features based on user roles.

3.2 Product Browsing

* FR-06: The system shall display a product list.  
* FR-07: The system shall allow product search.  
* FR-08: The system shall filter products by category.  
* FR-09: The system shall show product details.

3.3 Shopping Cart

* FR-10: The system shall allow users to add items to cart.  
* FR-11: The system shall update quantity.  
* FR-12: The system shall allow users to remove items from cart.  
* FR-13: The system shall compute total price.

3.4 Checkout and Orders

* FR-14: The system shall collect shipping information.  
* FR-15: The system shall confirm orders.  
* FR-16: The system shall generate order numbers.  
* FR-17: The system shall save order records.

3.5 Payment

* FR-18: The system shall only allow Cash on Delivery.  
* FR-19: The system shall record payment method.  
* FR-20: The system shall have a mechanism to update orders as paid/unpaid.

3.6 Order Tracking

* FR-21: The system shall allow users to view order history.  
* FR-22: The system shall display order status as updated by the seller.


3.7 Seller Management

* FR-23: The system shall allow sellers to add products.  
* FR-24: The system shall allow sellers to edit products.  
* FR-25: The system shall allow sellers to delete products.  
* FR-26: The system shall allow sellers to update order status for their products.  
* FR-27: The system shall allow sellers to view sales reports.  
* FR-28: The system shall allow sellers to view orders for their products

3.8 Admin Management

* FR-29: The system shall allow admin to manage users.

# 4-7

**4\. External Interface Requirements (WILL BE APPENDED LATER ON – DATE TBD)**

**4.1 User Interface**

* Web pages:  
* Homepage \- the entry point where highlights the promotional banner, categories, and featured products. It provides fast and easy navigation to top picks and new products, stores, cart, search bar, and profile.  
* Category \- displays products grouped by category to help users filter and browse items efficiently.  
* Products \- shows the list of products with the images, product name, price, description, specifications, stock availability, the shop, and “Add to Cart” and “Buy Now” buttons.  
* Cart \- shows the selected products added where users are allowed to adjust the quantities, remove the items, and view the total cost before ordering.  
* Order \- displays the order items, order status, total amount, shipping fee, and user address.  
* Stores \- shows the list of sellers and their shops including their logos and products offering.  
* Sign in \- secure login for existing users which requires email/phone number and password.   
* Sign Up/Register \- creating an account for new users collecting personal details, contact information, and login credentials.  
* Store Creation \- allows sellers to register their stores which requires their store name, store description, and logo.  
* Profile \- displays user information and saved addresses.  
* Manage Account   
* Seller Dashboard


Responsive layout for mobile \- ensures all pages adapt to different screen sizes.

**4.2. Hardware Interface**

* Smartphone \- can be accessed through mobile devices. It offers portability and convenience with a responsive design for smaller designs.  
* Computer \- provides full experience with larger screens. Ideal for sellers managing dashboards, uploading products and handling large operations.

**4.3 Software Interface**

* Database (MySQL) \- uses MySQL as its relational database to store normalized data in 3NF to ensure integrity and efficiency. 

**5\. Non-Functional Requirements (WILL BE APPENDED LATER ON – DATE TBD)**

**5.1 Performance**

* Page loads within 3 seconds \- fast response time to ensure users can navigate without delay.  
* Supports at least 20 concurrent users \- the system must handle 20 users accessing simultaneously without performance degradation.

**5.2 Security**

* Login authentication \- unauthorized entry is prohibited by securing login credentials to protect user accounts and seller dashboards.  
* Passwords encrypted \- safeguards sensitive information against breaches.  
* Seller and admin and modify products \- both have product management privileges. Sellers are allowed to modify within their own stores, while administrators has the full control over all products for supervision, quality assurance, and enforcement of rules.

**5.3 Usability**

* Easy navigation \- users shouldn’t have to think, the interface should be intuitive for faster and easier navigation without confusion.  
* Clear buttons and labels \- interactive elements must be clearly labeled and visually recognizable to reduce errors.

**5.4 Reliability**

*  System available 95% uptime \- must maintain consistent availability to allow users to access the platform all the time.  
* Backup database daily \- backups must be performed regularly to prevent data loss and easy recovery in case of unexpected issues.

**6\. Database Requirements (WILL BE APPENDED LATER ON – DATE TBD)**   
Include ERD   
List main tables:

* Users  
* Roles   
* Sellers    
* Products  
* Orders  
* Payment  
* Cart  
* Review  
* Commision

**7\. Acceptance Criteria**   
The system is accepted if: 

* Users can register and login   
* Users can place orders   
* Admin/Seller(s) can manage products   
* Orders are stored in database   
* Reports are generated

# UI Wireframes/Screen Designs

Low Fidelity

# ERD \+ Database Schema

**THIRD NORMAL FORM (3NF)**

**USERS**  
UserID (PK)  
FirstName  
MiddleName  
LastName  
Username (UNIQUE)  
Email (UNIQUE)  
UserPassword  
DOB  
ContactNo  
DateTimeRegistered  
LastLogin  
Status *// active, inactive*  
ProfilePictureURL

**ROLES**  
RoleID (PK)  
RoleName *//admin, customer, seller*

**USER\_ROLES**  
UserRoleID (PK)  
UserID (FK)  
RoleID (FK)

**SELLERS**  
SellerID (PK)  
UserID (FK) (UNIQUE)  
ShopName  
ShopDescription  
ShopLogoURL  
ShopStatus *//active, inactive, banned*  
RegisteredAt

**USER\_ADDRESSES**  
UserAddressID (PK)  
UserID (FK)  
AddressID (FK)  
AddressType *//home, work*  
isDefault

**ADDRESS**  
AddressID (PK)  
Street  
BarangayID (FK)

**BARANGAY**  
BarangayID (PK)  
Barangay  
CityID (FK)

**CITY**  
CityID (PK)  
City  
PostalCode  
ProvinceID (FK)

**PROVINCE**  
ProvinceID (PK)  
Province

**PRODUCTS**  
ProductID (PK)  
SellerID (FK)  
Name  
Description  
ImageURL  
Price  
CategoryID (FK)  
StockQuantity  
Status *//Available, unavailable*  
DateAdded  
LastUpdated  
AgeRangeID (FK)

**AGE\_RANGE**  
AgeRangeID (PK)  
MinAge  
MaxAge  
Label

**CATEGORIES** *//Coloring materials, coloring books, puzzles, worksheets, story books, board games, charts, basic educational books etc.*  
CategoryID (PK)  
CategoryName  
Description

**PRODUCT\_DETAILS**  
DetailID (PK)  
ProductID (FK)  
Height  
Weight  
Width  
Length  
Material

**ORDERS**  
OrderID (PK)  
UserID (FK)  
OrderDate  
OrderStatus *//Pending, In transit, Completed*  
TotalAmount  
ShippingFee  
UserAddressID (FK)  
Notes 

**ORDER\_ITEMS**  
OrderItemID (PK)  
OrderID (FK)  
ProductID (FK)  
Quantity  
Price  
OrderItemStatus  
DateDelivered

**PAYMENT**  
PaymentID (PK)  
OrderID (FK)  
PaymentStatus *//paid, unpaid*  
PaymentAmount  
PaymentDate

**CART**  
CartID (PK)  
UserID (FK)

**CART\_ITEMS**  
CartItemID (PK)  
CartID (FK)  
ProductID (FK)  
Quantity  
DateAdded

**REVIEW**  
ReviewID (PK)  
UserID (FK) (UNIQUE)  
OrderItemID(FK) (UNIQUE)  
Rating (1-5)  
Comment  
DatePosted

**COMMISSION**  
CommissionID (PK)  
SellerID (FK)  
OrderItemID (FK)  
CommissionAmount  
Status  
DatePaid

# Business Rules

1. A user can have many roles, and each role can be assigned to many users.  
2. A user can have many addresses, and an address can belong to many users.  
3. An address belongs to one barangay, and a barangay can have many addresses.  
4. A barangay belongs to one city, and a city can have many barangays.  
5. A city belongs to one province, and a province can have many cities.  
6. A user can be associated with one seller account, and each seller account belongs to exactly one user.  
7. A seller can list many products, and each product belongs to exactly one seller.  
8. A category can contain many products, and each product belongs to exactly one category.  
9. An age range can be associated with many products, and each product belongs to exactly one age range.  
10. A product can have one set of product details, and each product detail record belongs to exactly one product.  
11. A user can place many orders, and each order is placed by exactly one user.  
12. An order uses one user address, and a user address can be used in many orders.  
13. An order can contain many order items, and each order item belongs to exactly one order.  
14. A product can appear in many order items, and each order item refers to exactly one product.  
15. An order has one payment record, and each payment record belongs to exactly one order.  
16. A user can have one cart, and each cart belongs to exactly one user.  
17. A cart can contain many cart items, and each cart item belongs to exactly one cart.  
18. A product can appear in many cart items, and each cart item refers to exactly one product.  
19. A user can write many reviews, and each review is written by exactly one user.  
20. An order item can receive at most one review, and each review refers to exactly one order item.  
21. A seller can receive many commissions, and each commission belongs to exactly one seller.  
22. An order item generates one commission record, and each commission is linked to exactly one order item.

# SQL Commands

CREATE TABLE USERS(  
    UserID INT AUTO\_INCREMENT PRIMARY KEY,  
    FirstName VARCHAR(100) NOT NULL,  
    MiddleName VARCHAR(100),  
    LastName VARCHAR(100) NOT NULL,  
    Username VARCHAR(50) UNIQUE NOT NULL,  
    Email VARCHAR(100) UNIQUE NOT NULL,  
    UserPassword VARCHAR(255) NOT NULL,  
    DOB DATE NOT NULL,  
    ContactNo VARCHAR(13) NOT NULL,  
    DateTimeRegistered DATETIME NOT NULL DEFAULT CURRENT\_TIMESTAMP,  
    LastLogin DATETIME DEFAULT NULL,  
    STATUS ENUM('Active', 'Inactive') DEFAULT 'Active',  
    ProfilePictureURL VARCHAR(255)  
) ENGINE=InnoDB;

CREATE TABLE ROLES (  
    RoleID INT AUTO\_INCREMENT PRIMARY KEY,  
    RoleName VARCHAR(50) NOT NULL UNIQUE  
) ENGINE=InnoDB;

INSERT INTO ROLES (RoleName)  
VALUES ('Admin'), ('Customer'), ('Seller');

CREATE TABLE USER\_ROLES (  
    UserRoleID INT AUTO\_INCREMENT PRIMARY KEY,  
    UserID INT NOT NULL,  
    RoleID INT NOT NULL,  
    FOREIGN KEY (UserID) REFERENCES USERS(UserID),  
    FOREIGN KEY (RoleID) REFERENCES ROLES(RoleID),  
    UNIQUE(UserID, RoleID)  
)ENGINE=InnoDB;

CREATE TABLE SELLERS (  
    SellerID INT AUTO\_INCREMENT PRIMARY KEY,  
    UserID INT UNIQUE NOT NULL,  
    ShopName VARCHAR(255) NOT NULL UNIQUE,  
    ShopDescription TEXT,  
    ShopLogoURL VARCHAR(255),  
    ShopStatus ENUM('Active','Inactive','Banned') DEFAULT 'Active',  
    RegisteredAt DATETIME DEFAULT CURRENT\_TIMESTAMP,  
    FOREIGN KEY(UserID) REFERENCES USERS(UserID)  
) ENGINE=InnoDB;

CREATE TABLE PROVINCE(  
    ProvinceID INT AUTO\_INCREMENT PRIMARY KEY,  
    Province VARCHAR(100) NOT NULL UNIQUE  
)ENGINE=InnoDB; 

INSERT INTO PROVINCE (Province)  
VALUES ('Albay');

CREATE TABLE CITY(  
    CityID INT AUTO\_INCREMENT PRIMARY KEY,  
    City VARCHAR(100) NOT NULL,  
    PostalCode VARCHAR(10) NOT NULL,  
    ProvinceID INT NOT NULL,  
    FOREIGN KEY(ProvinceID) REFERENCES PROVINCE(ProvinceID),  
    UNIQUE(City, ProvinceID)  
)ENGINE=InnoDB; 

INSERT INTO CITY (City, PostalCode, ProvinceID) VALUES  
('Bacacay', '4509', 1),  
('Camalig', '4502', 1),  
('Daraga', '4501', 1),  
('Guinobatan', '4503', 1),  
('Jovellar', '4515', 1),  
('Legazpi City', '4500', 1),  
('Libon', '4507', 1),  
('Ligao', '4504', 1),  
('Malilipot', '4510', 1),  
('Malinao', '4512', 1),  
('Manito', '4514', 1),  
('Oas', '4504', 1),  
('Pio Duran', '4516', 1),  
('Polangui', '4506', 1),  
('Rapu-Rapu', '4517', 1),  
('Santo Domingo', '4508', 1),  
('Tabaco', '4511', 1),  
('Tiwi', '4513', 1);

CREATE TABLE BARANGAY(  
    BarangayID INT AUTO\_INCREMENT PRIMARY KEY,  
    Barangay VARCHAR(100) NOT NULL,  
    CityID INT NOT NULL,  
    FOREIGN KEY(CityID) REFERENCES CITY(CityID),  
    UNIQUE(Barangay, CityID)  
)ENGINE=InnoDB; 

INSERT INTO BARANGAY (Barangay, CityID) VALUES  
('Barangay 1 (Pob.)',1),  
('Barangay 10 (Pob.)', 1),  
('Barangay 11 (Pob.)', 1),  
('Barangay 12 (Pob.)', 1),  
('Barangay 13 (Pob.)', 1),  
('Barangay 14 (Pob.)', 1),  
('Barangay 2 (Pob.)', 1),  
('Barangay 3 (Pob.)', 1),  
('Barangay 4 (Pob.)', 1),  
('Barangay 5 (Pob.)', 1),  
('Barangay 6 (Pob.)', 1),  
('Barangay 7 (Pob.)', 1),  
('Barangay 8 (Pob.)', 1),  
('Barangay 9 (Pob.)', 1),  
('Bariw', 1),  
('Basud', 1),  
('Bayandong', 1),  
('Bonga (Upper)', 1),  
('Buang', 1),  
('Busdac (San Jose)', 1),  
('Cabasan', 1),  
('Cagbulacao', 1),  
('Cagraray', 1),  
('Cajogutan', 1),  
('Cawayan', 1),  
('Damacan', 1),  
('Gubat Ilawod', 1),  
('Gubat Iraya', 1),  
('Hindi', 1),  
('Igang', 1),  
('Langaton', 1),  
('Manaet', 1),  
('Mapulang Daga', 1),  
('Mataas', 1),  
('Misibis', 1),  
('Nahapunan', 1),  
('Namanday', 1),  
('Namantao', 1),  
('Napao', 1),  
('Panarayon', 1),  
('Pigcobohan', 1),  
('Pili Ilawod', 1),  
('Pili Iraya', 1),  
('Pongco (Lower Bonga)', 1),  
('San Pablo', 1),  
('San Pedro', 1),  
('Sogod', 1),  
('Sula', 1),  
('Tambilagao (Tambognon)', 1),  
('Tambongon (Tambilagao)', 1),  
('Tanagan', 1),  
('Uson', 1),  
('Vinisitahan-Basud (Mainland)', 1),  
('Vinisitahan-Napao (Island)', 1),  
('Anoling', 2),  
('Baligang', 2),  
('Bantonan', 2),  
('Barangay 1 (Pob.)', 2),  
('Barangay 2 (Pob.)', 2),  
('Barangay 3 (Pob.)', 2),  
('Barangay 4 (Pob.)', 2),  
('Barangay 5 (Pob.)', 2),  
('Barangay 6 (Pob.)', 2),  
('Barangay 7 (Pob.)', 2),  
('Bariw', 2),  
('Binanderahan', 2),  
('Binitayan', 2),  
('Bongabong', 2),  
('Cabagnan', 2),  
('Cabraran Pequeno', 2),  
('Caguiba', 2),  
('Calabidongan', 2),  
('Comun', 2),  
('Cotmon', 2),  
('Del Rosario', 2),  
('Gapo', 2),  
('Gotob', 2),  
('Ilawod', 2),  
('Iluluan', 2),  
('Libod', 2),  
('Ligban', 2),  
('Mabunga', 2),  
('Magogon', 2),  
('Manawan', 2),  
('Maninila', 2),  
('Mina', 2),  
('Miti', 2),  
('Palanog', 2),  
('Panoypoy', 2),  
('Pariaan', 2),  
('Quinartilan', 2),  
('Quirangay', 2),  
('Quitinday', 2),  
('Salugan', 2),  
('Solong', 2),  
('Sua', 2),  
('Sumlang', 2),  
('Tagaytay', 2),  
('Tagoytoy', 2),  
('Taladong', 2),  
('Taloto', 2),  
('Taplacon', 2),  
('Tinago', 2),  
('Tumpa', 2),  
('Alcala', 3),  
('Alobo', 3),  
('Anislag', 3),  
('Bagumbayan', 3),  
('Balinad', 3),  
('Banadero', 3),  
('Banag', 3),  
('Bascaran', 3),  
('Bigao', 3),  
('Binitayan', 3),  
('Bongalon', 3),  
('Budiao', 3),  
('Burgos', 3),  
('Busay', 3),  
('Canaron', 3),  
('Cullat', 3),  
('Dela Paz', 3),  
('Dinoronan', 3),  
('Gabawan', 3),  
('Gapo', 3),  
('Ibaugan', 3),  
('Ilawod Area Pob. (Dist. 2)', 3),  
('Inarado', 3),  
('Kidaco', 3),  
('Kilicao', 3),  
('Kimantong', 3),  
('Kinawitan', 3),  
('Kiwalo', 3),  
('Lacag', 3),  
('Mabini', 3),  
('Malabog', 3),  
('Malobago', 3),  
('Maopi', 3),  
('Market Area Pob. (Dist. 1)', 3),  
('Maroroy', 3),  
('Matnog', 3),  
('Mayon', 3),  
('Mi-isi', 3),  
('Nabasan', 3),  
('Namantao', 3),  
('Pandan', 3),  
('Penafrancia', 3),  
('Sagpon', 3),  
('Salvacion', 3),  
('San Rafael', 3),  
('San Ramon', 3),  
('San Roque', 3),  
('San Vicente Grande', 3),  
('San Vicente Pequeno', 3),  
('Sipi', 3),  
('Tabon-Tabon', 3),  
('Tagas', 3),  
('Talahib', 3),  
('Villahermosa', 3),  
('Agpay', 4),  
('Balite', 4),  
('Banao', 4),  
('Batbat', 4),  
('Binogsacan Lower', 4),  
('Binogsacan Upper', 4),  
('Bololo', 4),  
('Bubulusan', 4),  
('Calzada', 4),  
('Catomag', 4),  
('Dona Mercedes', 4),  
('Dona Tomasa (Magatol)', 4),  
('Ilawod', 4),  
('Inamnan Grande', 4),  
('Inamnan Pequeno', 4),  
('Inascan', 4),  
('Iraya', 4),  
('Lomacao', 4),  
('Maguiron', 4),  
('Maipon', 4),  
('Malabnig', 4),  
('Malipo', 4),  
('Malobago', 4),  
('Maninila', 4),  
('Mapaco', 4),  
('Marcial O. Rañola (Cabaloaon)', 4),  
('Masarawag', 4),  
('Mauraro', 4),  
('Minto', 4),  
('Morera', 4),  
('Muladbucad Grande', 4),  
('Muladbucad Pequeno', 4),  
('Ongo', 4),  
('Palanas', 4),  
('Poblacion', 4),  
('Pood', 4),  
('Quibongbongan', 4),  
('Quitago', 4),  
('San Francisco', 4),  
('San Jose (Ogsong)', 4),  
('San Rafael', 4),  
('Sinungtan', 4),  
('Tandarora', 4),  
('Travesia', 4),  
('Aurora Pob. (Bgy. 6)', 5),  
('Bagacay', 5),  
('Bautista', 5),  
('Cabraran', 5),  
('Calzada Pob. (Bgy, 7)', 5),  
('Del Rosario', 5),  
('Estrella', 5),  
('Florista', 5),  
('Mabini Pob. (Bgy. 2)', 5),  
('Magsaysay Pob. (Bgy. 4)', 5),  
('Mamlad', 5),  
('Maogog', 5),  
('Mercado Pob. (Bgy. 5)', 5),  
('Plaza Pob. (Bgy. 3)', 5),  
('Quitinday Pob. (Bgy. 8)', 5),  
('Rizal Pob. (Bgy. 1)', 5),  
('Salvacion', 5),  
('San Isidro', 5),  
('San Roque', 5),  
('San Vicente', 5),  
('Sinagaran', 5),  
('Villa Paz', 5),  
('White Deer Pob. (Bgy. 9)', 5),  
('Bgy. 1 \- Em''s Barrio(Pob)', 6),  
('Bgy. 10 \- Cabugao', 6),  
('Bgy. 11 \- Maoyod Pob. (Bgy. 10 & 11)', 6),  
('Bgy. 12 \- Tula-tula (Pob.)', 6),  
('Bgy. 13 \- Ilawod West Pob. (Ilawod 1)', 6),  
('Bgy. 14 \- Ilawod Pob. (Ilawod 2)', 6),  
('Bgy. 15 \- Ilawod East Pob. (Ilawod 3)', 6),  
('Bgy. 16 \- Kawit-East Washington Drive (Pob.)', 6),  
('Bgy. 17 \- Rizal Street', 6),  
('Bgy. 18 \- Cabagnan West (Pob.)', 6),  
('Bgy. 19 \- Cabagnan', 6),  
('Bgy. 2 \- Em''s Barrio South (Pob.)', 6),  
('Bgy. 20 \- Cabagnan East (Pob.)', 6),  
('Bgy. 21 \- Binanuahan West (Pob.)', 6),  
('Bgy. 22 \- Binanuahan East (Pob.)', 6),  
('Bgy. 23 \- Imperial Court Subd. (Pob.)', 6),  
('Bgy. 24 \- Rizal Street', 6),  
('Bgy. 25 \- Lapu-Lapu (Pob.)', 6),  
('Bgy. 26 \- Dinagaan (Pob.)', 6),  
('Bgy. 27 \- Victory Village South (Pob.)', 6),  
('Bgy. 28 \- Victory Village North (Pob.)', 6),  
('Bgy. 29 \- Sabang (Pob.)', 6),  
('Bgy. 3 \- Em''s Barrio East (Pob)', 6),  
('Bgy. 30 \- Pigcale (Pob.)', 6),  
('Bgy. 31 \- Centro-Baybay (Pob.)', 6),  
('Bgy. 32 \- San Roque (Bgy. 66)', 6),  
('Bgy. 33 \- Pnr-Penaranda St.-Iraya (Pob.)', 6),  
('Bgy. 34 \- Oro Site-Magallanes St. (Pob.)', 6),  
('Bgy. 35 \- Tinago (Pob.)', 6),  
('Bgy. 36 \- Kapantawan (Pob.)', 6),  
('Bgy. 37 \- Bitano (Pob.)', 6),  
('Bgy. 38 \- Gogon (Bgy. 54)', 6),  
('Bgy. 39 \- Bonot (Pob.)', 6),  
('Bgy. 4 \- Sagpon Pob. (Sagpon 1)', 6),  
('Bgy. 40 \- Cruzada (Bgy. 52)', 6),  
('Bgy. 41 \- Bogtong (Bgy. 45)', 6),  
('Bgy. 42 \- Rawis (Bgy. 65)', 6),  
('Bgy. 43 \- Tamaoyan (Bgy. 67)', 6),  
('Bgy. 44 \- Pawa (Bgy. 61)', 6),  
('Bgy. 45 \- Dita (Bgy. 51)', 6),  
('Bgy. 46 \- San Joaquin (Bgy. 64)', 6),  
('Bgy. 47 \- Arimbay', 6),  
('Bgy. 48 \- Bagong Abre (Bgy. 42)', 6),  
('Bgy. 49 \- Bigaa (Bgy. 44)', 6),  
('Bgy. 5 \- Sagmin Pob. (Sagpon 2)', 6),  
('Bgy. 50 \- Padang (Bgy. 60)', 6),  
('Bgy. 51 \- Buyuan (Bgy. 49)', 6),  
('Bgy. 52 \- Matanag', 6),  
('Bgy. 53 \- Bonga (Bgy. 48)', 6),  
('Bgy. 54 \- Mabinit (Bgy. 59)', 6),  
('Bgy. 55 \- Estanza (Bgy. 53)', 6),  
('Bgy. 56 \- Taysan (Bgy. 68)', 6),  
('Bgy. 57 \- Dap-Dap (Bgy. 69)', 6),  
('Bgy. 58 \- Buragwis', 6),  
('Bgy. 59 \- Puro (Bgy. 63)', 6),  
('Bgy. 6 \- Banadero Pob. (Sagpon 3)', 6),  
('Bgy. 60 \- Lamba', 6),  
('Bgy. 61 \- Maslog (Bgy. 58)', 6),  
('Bgy. 62 \- Homapon (Bgy. 55)', 6),  
('Bgy. 63 \- Mariawa (Bgy. 56)', 6),  
('Bgy. 64 \- Bagacay (Bgy. 41 Bagacay)', 6),  
('Bgy. 65 \- Imalnod (Bgy. 57)', 6),  
('Bgy. 66 \- Banquerohan (Bgy. 43)', 6),  
('Bgy. 67 \- Bariis (Bgy. 46)', 6),  
('Bgy. 68 \- San Francisco (Bgy. 62)', 6),  
('Bgy. 69 \- Buenavista (Bgy. 47)', 6),  
('Bgy. 7 \- Bano (Pob.)', 6),  
('Bgy. 70 \- Cagbacong (Bgy. 50)', 6),  
('Bgy. 8 \- Bagumbayan (Pob.)', 6),  
('Bgy. 9 \- Pinaric (Pob.)', 6),  
('Alongong', 7),  
('Apud', 7),  
('Bacolod', 7),  
('Bariw', 7),  
('Bonbon', 7),  
('Buga', 7),  
('Bulusan', 7),  
('Burabod', 7),  
('Caguscos', 7),  
('East Carisac', 7),  
('Harigue', 7),  
('Libtong', 7),  
('Linao', 7),  
('Mabayawas', 7),  
('Macabugos', 7),  
('Magallang', 7),  
('Malabiga', 7),  
('Marayag', 7),  
('Matara', 7),  
('Molosbolos', 7),  
('Natasan', 7),  
('Nino Jesus (Santo Nino Jesus)', 7),  
('Nogpo', 7),  
('Pantao', 7),  
('Rawis', 7),  
('Sagrada Familia', 7),  
('Salvacion', 7),  
('Sampongan', 7),  
('San Agustin', 7),  
('San Antonio', 7),  
('San Isidro', 7),  
('San Jose', 7),  
('San Pascual', 7),  
('San Ramon', 7),  
('San Vicente', 7),  
('Santa Cruz', 7),  
('Talin-Talin', 7),  
('Tambo', 7),  
('Villa Petrona', 7),  
('West Carisac', 7),  
('Zone I (Pob.)', 7),  
('Zone II (Pob.)', 7),  
('Zone III (Pob.)', 7),  
('Zone IV (Pob.)', 7),  
('Zone V (Pob.)', 7),  
('Zone VI (Pob.)', 7),  
('Zone VII (Pob.)', 7),  
('Abella', 8),  
('Allang', 8),  
('Amtic', 8),  
('Bacong', 8),  
('Bagumbayan', 8),  
('Balanac', 8),  
('Baligang', 8),  
('Barayong', 8),  
('Basag', 8),  
('Batang', 8),  
('Bay', 8),  
('Binanowan', 8),  
('Binatagan (Pob.)', 8),  
('Bobonsuran', 8),  
('Bonga', 8),  
('Busac', 8),  
('Busay', 8),  
('Cabarian', 8),  
('Calzada (Pob.)', 8),  
('Catburawan', 8),  
('Cavasi', 8),  
('Culliat', 8),  
('Dunao', 8),  
('Francia', 8),  
('Guilid', 8),  
('Herrera', 8),  
('Layon', 8),  
('Macalidong', 8),  
('Mahaba', 8),  
('Malama', 8),  
('Maonon', 8),  
('Nabonton', 8),  
('Nasisi', 8),  
('Oma-Oma', 8),  
('Palapas', 8),  
('Pandan', 8),  
('Paulba', 8),  
('Paulog', 8),  
('Pinamaniquian', 8),  
('Pinit', 8),  
('Ranao-Ranao', 8),  
('San Vicente', 8),  
('Santa Cruz (Pob.)', 8),  
('Tagpo', 8),  
('Tambo', 8),  
('Tandarora', 8),  
('Tastas', 8),  
('Tinago', 8),  
('Tinampo', 8),  
('Tiongson', 8),  
('Tomolin', 8),  
('Tuburan', 8),  
('Tula-Tula Grande', 8),  
('Tula-Tula Pequeno', 8),  
('Tupas', 8),  
('Barangay I (Pob.)', 9),  
('Barangay II (Pob.)', 9),  
('Barangay III (Pob.)', 9),  
('Barangay IV (Pob.)', 9),  
('Barangay V (Pob.)', 9),  
('Binitayan', 9),  
('Calbayog', 9),  
('Canaway', 9),  
('Salvacion', 9),  
('San Antonio Santicon (Pob.)', 9),  
('San Antonio Sulong', 9),  
('San Francisco', 9),  
('San Isidro Ilawod', 9),  
('San Isidro Iraya', 9),  
('San Jose', 9),  
('San Roque', 9),  
('Santa Cruz', 9),  
('Santa Teresa', 9),  
('Awang', 10),  
('Bagatangki', 10),  
('Bagumbayan', 10),  
('Balading', 10),  
('Balza', 10),  
('Bariw', 10),  
('Baybay', 10),  
('Bulang', 10),  
('Burabod', 10),  
('Cabunturan', 10),  
('Comun', 10),  
('Diaro', 10),  
('Estancia', 10),  
('Jonop', 10),  
('Labnig', 10),  
('Libod', 10),  
('Malolos', 10),  
('Matalipni', 10),  
('Ogob', 10),  
('Pawa', 10),  
('Payahan', 10),  
('Poblacion', 10),  
('Quinarabasahan', 10),  
('Santa Elena', 10),  
('Soa', 10),  
('Sugcad', 10),  
('Tagoytoy', 10),  
('Tanawan', 10),  
('Tuliw', 10),  
('Balabagon', 11),  
('Balasbas', 11),  
('Bamban', 11),  
('Buyo', 11),  
('Cabacongan', 11),  
('Cabit', 11),  
('Cawayan', 11),  
('Cawit', 11),  
('Holugan', 11),  
('It-Ba (Pob.)', 11),  
('Malobago', 11),  
('Manumbalay', 11),  
('Nagotgot', 11),  
('Pawa', 11),  
('Tinapian', 11),  
('Badbad', 12),  
('Badian', 12),  
('Bagsa', 12),  
('Bagumbayan', 12),  
('Balogo', 12),  
('Banao', 12),  
('Bangiawon', 12),  
('Bogtong', 12),  
('Bongoran', 12),  
('Busac', 12),  
('Cadawag', 12),  
('Cagmanaba', 12),  
('Calaguimit', 12),  
('Calpi', 12),  
('Calzada', 12),  
('Camagong', 12),  
('Casinagan', 12),  
('Centro Poblacion', 12),  
('Coliat', 12),  
('Del Rosario', 12),  
('Gumabao', 12),  
('Ilaor Norte', 12),  
('Ilaor Sur', 12),  
('Iraya Norte', 12),  
('Iraya Sur', 12),  
('Manga', 12),  
('Maporong', 12),  
('Maramba', 12),  
('Matambo', 12),  
('Mayag', 12),  
('Mayao', 12),  
('Maroponros', 12),  
('Nagas', 12),  
('Obaliw-Rinas', 12),  
('Pistola', 12),  
('Ramay', 12),  
('Rizal', 12),  
('Saban', 12),  
('San Agustin', 12),  
('San Antonio', 12),  
('San Isidro', 12),  
('San Jose', 12),  
('San Juan', 12),  
('San Miguel', 12),  
('San Pascual (Nale)', 12),  
('San Ramon', 12),  
('San Vicente (Suca)', 12),  
('Tablon', 12),  
('Talisay', 12),  
('Talongog', 12),  
('Tapel', 12),  
('Tobgon', 12),  
('Tobog', 12),  
('Agol', 13),  
('Alabangpuro', 13),  
('Banawan (Binawan)', 13),  
('Barangay I (Pob.)', 13),  
('Barangay II (Pob.)', 13),  
('Barangay III (Pob.)', 13),  
('Barangay IV (Pob.)', 13),  
('Barangay V (Pob.)', 13),  
('Basicao Coastal', 13),  
('Basicao Interior', 13),  
('Binodegahan', 13),  
('Buenavista', 13),  
('Buyo', 13),  
('Caratagan', 13),  
('Cuyaoyao', 13),  
('Flores', 13),  
('La Medalla', 13),  
('Lawinon', 13),  
('Macasitas', 13),  
('Malapay', 13),  
('Malidong', 13),  
('Mamlad', 13),  
('Marigondon', 13),  
('Matanglad', 13),  
('Nablangbulod', 13),  
('Oringon', 13),  
('Palapas', 13),  
('Panganiran', 13),  
('Rawis', 13),  
('Salvacion', 13),  
('Santo Cristo', 13),  
('Sukip', 13),  
('Tibabo', 13),  
('Agos', 14),  
('Alnay', 14),  
('Alomon', 14),  
('Amoguis', 14),  
('Anopol', 14),  
('Apad', 14),  
('Balaba', 14),  
('Balangibang', 14),  
('Balinad', 14),  
('Basud', 14),  
('Binagbangan (Pintor)', 14),  
('Buyo', 14),  
('Centro Occidental (Pob.)', 14),  
('Centro Oriental (Pob.)', 14),  
('Cepres', 14),  
('Cotmon', 14),  
('Cotnogan', 14),  
('Danao', 14),  
('Gabon', 14),  
('Gamot', 14),  
('Itaran', 14),  
('Kinale', 14),  
('Kinuartilan', 14),  
('La Medalla', 14),  
('La Purisima', 14),  
('Lanigay', 14),  
('Lidong', 14),  
('Lourdes', 14),  
('Magpanambo', 14),  
('Magurang', 14),  
('Matacon', 14),  
('Maynaga', 14),  
('Maysua', 14),  
('Mendez', 14),  
('Napo', 14),  
('Pinagdapugan', 14),  
('Ponso', 14),  
('Salvacion', 14),  
('San Roque', 14),  
('Santa Cruz', 14),  
('Santa Teresita', 14),  
('Santicon', 14),  
('Sugcad', 14),  
('Ubaliw', 14),  
('Bagaobawan', 15),  
('Batan', 15),  
('Bilbao', 15),  
('Binosawan', 15),  
('Bogtong', 15),  
('Buenavista', 15),  
('Buhatan', 15),  
('Calanaga', 15),  
('Caracaran', 15),  
('Carogcog', 15),  
('Dap-Dap', 15),  
('Gaba', 15),  
('Galicia', 15),  
('Guadalupe', 15),  
('Hamorawon', 15),  
('Lagundi', 15),  
('Liguan', 15),  
('Linao', 15),  
('Malabago', 15),  
('Mananao', 15),  
('Mancao', 15),  
('Manila', 15),  
('Masaga', 15),  
('Morocborocan', 15),  
('Nagcalsot', 15),  
('Pagcolbon', 15),  
('Poblacion', 15),  
('Sagrada', 15),  
('San Ramon', 15),  
('Santa Barbara', 15),  
('Tinocawan', 15),  
('Tinopan', 15),  
('Viga', 15),  
('Villahermosa', 15),  
('Alimsog', 16),  
('Bagong San Roque', 16),  
('Buhatan', 16),  
('Calayucay', 16),  
('Del Rosario Pob. (Bgy. 3)', 16),  
('Fidel Surtida', 16),  
('Lidong', 16),  
('Market Site Pob. (Bgy. 9)', 16),  
('Nagsiya Pob. (Bgy. 8)', 16),  
('Pandayan Pob. (Bgy. 10)', 16),  
('Salvacion', 16),  
('San Andres', 16),  
('San Fernando', 16),  
('San Franciso Pob. (Bgy. 1)', 16),  
('San Isidro', 16),  
('San Juan Pob. (Bgy. 2)', 16),  
('San Pedro Pob. (Bgy. 5)', 16),  
('San Rafael Pob. (Bgy. 7)', 16),  
('San Roque', 16),  
('San Vicente Pob. (Bgy. 6)', 16),  
('Santa Misericordia', 16),  
('Santo Domingo Pob. (Bgy. 4)', 16),  
('Santo Nino', 16),  
('Agnas (San Miguel Island)', 17),  
('Bacolod', 17),  
('Bangkilingan', 17),  
('Bantayan', 17),  
('Baranghawon', 17),  
('Basagan', 17),  
('Basud (Pob.)', 17),  
('Bognabong', 17),  
('Bombon (Pob.)', 17),  
('Bonot', 17),  
('Buang', 17),  
('Buhian', 17),  
('Cabagnan', 17),  
('Cobo', 17),  
('Comon', 17),  
('Cormidal', 17),  
('Divino Rostro (Pob.)', 17),  
('Fatima', 17),  
('Guinobat', 17),  
('Hacienda (San Miguel Island)', 17),  
('Magapo', 17),  
('Mariroc', 17),  
('Matagbac', 17),  
('Oras', 17),  
('Oson', 17),  
('Panal', 17),  
('Pawa', 17),  
('Pinagbobong', 17),  
('Quinale Cabasan (Pob.)', 17),  
('Quinastillojan', 17),  
('Rawis (San Miguel Island)', 17),  
('Sagurong (San Miguel Island)', 17),  
('Salvacion', 17),  
('San Antonio', 17),  
('San Carlos', 17),  
('San Isidro (Boring)', 17),  
('San Juan (Pob.)', 17),  
('San Lorenzo', 17),  
('San Ramon', 17),  
('San Roque', 17),  
('San Vicente', 17),  
('Santo Cristo (Pob.)', 17),  
('Sua‑Igot', 17),  
('Tabiguian', 17),  
('Tagas', 17),  
('Tayhi (Pob.)', 17),  
('Visita (San Miguel Island)', 17),  
('Bagumbayan', 18),  
('Bariis', 18),  
('Baybay', 18),  
('Belen (Malabog)', 18),  
('Biyong', 18),  
('Bolo', 18),  
('Cale', 18),  
('Cararayan', 18),  
('Coro-Coro', 18),  
('Dap-Dap', 18),  
('Gajo', 18),  
('Joroan', 18),  
('Libjo', 18),  
('Libtong', 18),  
('Matalibong', 18),  
('Maynonong', 18),  
('Mayong', 18),  
('Misibis', 18),  
('Naga', 18),  
('Nagas', 18),  
('Oyama', 18),  
('Putsan', 18),  
('San Bernardo', 18),  
('Sogod', 18),  
('Tigbi (Pob.)', 18);

CREATE TABLE ADDRESS(  
    AddressID INT AUTO\_INCREMENT PRIMARY KEY,  
    Street VARCHAR(255) NOT NULL,  
    BarangayID INT NOT NULL,  
    FOREIGN KEY(BarangayID) REFERENCES BARANGAY(BarangayID),  
    UNIQUE(Street, BarangayID)  
)ENGINE=InnoDB; 

CREATE TABLE USER\_ADDRESSES(  
    UserAddressID INT AUTO\_INCREMENT PRIMARY KEY,  
    UserID INT NOT NULL,  
    AddressID INT NOT NULL,  
    AddressType ENUM('Home', 'Work'),  
    isDefault BOOLEAN DEFAULT FALSE,  
    FOREIGN KEY(UserID) REFERENCES USERS(UserID),  
    FOREIGN KEY(AddressID) REFERENCES ADDRESS(AddressID),  
    UNIQUE(UserID, AddressID)  
)ENGINE=InnoDB;

CREATE TABLE AGE\_RANGE (  
    AgeRangeID INT AUTO\_INCREMENT PRIMARY KEY,  
    MinAge INT NOT NULL,  
    MaxAge INT,  
    Label VARCHAR(255)  
)ENGINE=InnoDB;

INSERT INTO AGE\_RANGE (MinAge, MaxAge, Label) VALUES  
(0, 1, 'Infant (0–1 yr)'),  
(1, 2, 'Toddler (1–2 yrs)'),  
(2, 3, 'Early Preschool (2–3 yrs)'),  
(3, 4, 'Preschool (3–4 yrs)'),  
(4, 5, 'Pre-K (4–5 yrs)'),  
(5, 6, 'Kindergarten (5–6 yrs)'),  
(6, 7, 'Early Primary (6–7 yrs)');

CREATE TABLE CATEGORIES (  
    CategoryID INT AUTO\_INCREMENT PRIMARY KEY,  
    CategoryName VARCHAR(255) NOT NULL UNIQUE,  
    DESCRIPTION TEXT  
)ENGINE=InnoDB;

INSERT INTO CATEGORIES (CategoryName, Description) VALUES  
('Coloring Materials', 'Crayons, markers, colored pencils, and other coloring tools for kids.'),  
('Coloring Books', 'Books designed for children to color, including themes like animals, alphabets, and shapes.'),  
('Puzzles', 'Jigsaw puzzles, matching puzzles, and brain-teaser games for early learners.'),  
('Worksheets', 'Worksheets for learning numbers, letters, and shapes.'),  
('Story Books', 'Children''s storybooks for early literacy and imagination development.'),  
('Board Games', 'Simple board games suitable for kids to develop problem-solving and social skills.'),  
('Charts', 'Educational charts for alphabets, numbers, colors, and basic concepts.'),  
('Basic Educational Books', 'Books covering early learning concepts such as ABCs, counting, and shapes.'),  
('Sensory Toys', 'Toys designed to stimulate touch, sight, and sound for infants and toddlers.'),  
('Learning Kits', 'Complete kits including multiple materials for early childhood learning activities.');

CREATE TABLE PRODUCT (  
    ProductID INT AUTO\_INCREMENT PRIMARY KEY,  
    SellerID INT NOT NULL,  
    Name VARCHAR(100) NOT NULL,  
    Description TEXT NOT NULL,  
    ImageURL VARCHAR(255) NOT NULL,  
    Price DECIMAL(10,2) NOT NULL,  
    CategoryID INT NOT NULL,  
    StockQuantity INT NOT NULL DEFAULT 1,  
    Status ENUM('Available','Unavailable') DEFAULT 'Available',  
    DateAdded DATETIME DEFAULT CURRENT\_TIMESTAMP,  
    LastUpdated DATETIME DEFAULT CURRENT\_TIMESTAMP ON UPDATE CURRENT\_TIMESTAMP,  
    AgeRangeID INT NOT NULL,  
    FOREIGN KEY (SellerID) REFERENCES SELLERS(SellerID),  
    FOREIGN KEY (CategoryID) REFERENCES CATEGORIES(CategoryID),  
    FOREIGN KEY (AgeRangeID) REFERENCES AGE\_RANGE(AgeRangeID),  
    UNIQUE(SellerID, Name)  
)ENGINE=InnoDB;

CREATE TABLE PRODUCT\_DETAILS (  
    DetailID INT AUTO\_INCREMENT PRIMARY KEY,  
    ProductID INT NOT NULL,  
    Height DECIMAL(10,2),  
    Weight DECIMAL(10,2),  
    Width DECIMAL(10,2),  
    Length DECIMAL(10,2),  
    Material VARCHAR(255),  
    FOREIGN KEY (ProductID) REFERENCES PRODUCT(ProductID),  
    UNIQUE(ProductID)  
)ENGINE=InnoDB;

CREATE TABLE ORDERS (  
    OrderID INT AUTO\_INCREMENT PRIMARY KEY,  
    UserID INT NOT NULL,  
    OrderDate DATETIME NOT NULL DEFAULT CURRENT\_TIMESTAMP,  
    OrderStatus ENUM('Pending','In transit','Completed') DEFAULT 'Pending',  
    TotalAmount DECIMAL(10,2) NOT NULL,  
    ShippingFee DECIMAL(10,2) NOT NULL DEFAULT 58,  
    UserAddressID INT NOT NULL,  
    Notes TEXT,  
    FOREIGN KEY (UserID) REFERENCES USERS(UserID),  
    FOREIGN KEY (UserAddressID) REFERENCES USER\_ADDRESSES(UserAddressID)  
)ENGINE=InnoDB;

CREATE TABLE ORDER\_ITEMS (  
    OrderItemID INT AUTO\_INCREMENT PRIMARY KEY,  
    OrderID INT NOT NULL,  
    ProductID INT NOT NULL,  
    Quantity INT DEFAULT 1,  
    Price DECIMAL(10,2) NOT NULL,  
    OrderItemStatus ENUM('Pending','In transit','Completed') DEFAULT 'Pending',  
    DateDelivered DATETIME,  
    FOREIGN KEY (OrderID) REFERENCES ORDERS(OrderID),  
    FOREIGN KEY (ProductID) REFERENCES PRODUCT(ProductID),  
    UNIQUE(OrderID, ProductID)  
)ENGINE=InnoDB;

CREATE TABLE PAYMENT (  
    PaymentID INT AUTO\_INCREMENT PRIMARY KEY,  
    OrderID INT NOT NULL,  
    PaymentStatus ENUM('Paid','Unpaid') DEFAULT 'Unpaid',  
    PaymentAmount DECIMAL(10,2) NOT NULL,  
    PaymentDate DATETIME,  
    FOREIGN KEY (OrderID) REFERENCES ORDERS(OrderID)  
)ENGINE=InnoDB;

CREATE TABLE COMMISSION (  
    CommissionID INT AUTO\_INCREMENT PRIMARY KEY,  
    SellerID INT NOT NULL,  
    OrderItemID INT NOT NULL,  
    CommissionAmount DECIMAL(10,2) NOT NULL,  
    Status ENUM('Paid','Unpaid') DEFAULT 'Unpaid',  
    DatePaid DATETIME,  
    FOREIGN KEY (SellerID) REFERENCES SELLERS(SellerID),  
    FOREIGN KEY (OrderItemID) REFERENCES ORDER\_ITEMS(OrderItemID)  
)ENGINE=InnoDB;

CREATE TABLE CART (  
    CartID INT AUTO\_INCREMENT PRIMARY KEY,  
    UserID INT NOT NULL,  
    FOREIGN KEY (UserID) REFERENCES USERS(UserID),  
    UNIQUE(UserID)  
)ENGINE=InnoDB;

CREATE TABLE CART\_ITEMS (  
    CartItemID INT AUTO\_INCREMENT PRIMARY KEY,  
    CartID INT NOT NULL,  
    ProductID INT NOT NULL,  
    Quantity INT DEFAULT 1,  
    DateAdded DATETIME DEFAULT CURRENT\_TIMESTAMP,  
    FOREIGN KEY (CartID) REFERENCES CART(CartID),  
    FOREIGN KEY (ProductID) REFERENCES PRODUCT(ProductID),  
    UNIQUE(CartID, ProductID)  
)ENGINE=InnoDB;

CREATE TABLE REVIEWS (  
    ReviewID INT AUTO\_INCREMENT PRIMARY KEY,  
    UserID INT NOT NULL,  
    OrderItemID INT NOT NULL,  
    Rating ENUM('1','2','3','4','5') DEFAULT '5',  
    Comment TEXT,  
    DatePosted DATETIME DEFAULT CURRENT\_TIMESTAMP,  
    FOREIGN KEY (UserID) REFERENCES USERS(UserID),  
    FOREIGN KEY (OrderItemID) REFERENCES ORDER\_ITEMS(OrderItemID),  
    UNIQUE(UserID, OrderItemID)  
)ENGINE=InnoDB;

# Links

**UI Wireframe (Low Fidelity):**  
[https://www.figma.com/design/Xd8RAGDGaljiF0eJHyAfzb/Wire-Frame?node-id=0-1\&t=NLwlDeVwhWaCv6Ft-1](https://www.figma.com/design/Xd8RAGDGaljiF0eJHyAfzb/Wire-Frame?node-id=0-1&t=NLwlDeVwhWaCv6Ft-1)

**UI Wireframe (High Fidelity):**  
[https://www.figma.com/design/Xd8RAGDGaljiF0eJHyAfzb/Wire-Frame?node-id=0-1\&t=NLwlDeVwhWaCv6Ft-1](https://www.figma.com/design/Xd8RAGDGaljiF0eJHyAfzb/Wire-Frame?node-id=0-1&t=NLwlDeVwhWaCv6Ft-1)

**UI Elements/Pictures**  
[https://drive.google.com/drive/folders/1dMeVjsFrflESrIlmlS081xjl4fFWhrEv](https://drive.google.com/drive/folders/1dMeVjsFrflESrIlmlS081xjl4fFWhrEv)

**ERD**  
[ARTISTRYX.drawio \- Google Drive](https://drive.google.com/file/d/1flGPNQN0vxdQ8Rws2xvpMpJutgDbXgyt/view?fbclid=IwY2xjawPywfZleHRuA2FlbQIxMABicmlkETFTaHlyaWNQdjRiMFE5M2luc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHmC0OwH_Am_usJfg9DMIfwtaiZt9AKWQpYNo33tMYchLLPvn7y0ATuJSNcTV_aem_5rHf2eMztba11ENTdsXk5A)

**GANTT CHART**  
[https://www.canva.com/design/DAHBNan\_zsA/jdZwwE2gU\_LBO7LATEyZUg/edit?utm\_content=DAHBNan\_zsA\&utm\_campaign=designshare\&utm\_medium=link2\&utm\_source=sharebutton](https://www.canva.com/design/DAHBNan_zsA/jdZwwE2gU_LBO7LATEyZUg/edit?utm_content=DAHBNan_zsA&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)

**DATABASE**  
[Artistyx](https://drive.google.com/drive/folders/1JQJgb-q4Ra8MYk7Xd8dr2RiHAj3_1qIM?usp=sharing)

**REFERENCES FOR SRS FORMAT**   
[Prof. Vanselow \- SRS](https://sites.google.com/site/profvanselow/swebok/software-requirements-ch-1/5-specification/srs?)

[How to Write a Software Requirements Specification (SRS) Document | Perforce Software](https://www.perforce.com/blog/alm/how-write-software-requirements-specification-srs-document)

[Software Requirements Specification Sample Format & Document Guide with Examples \- PaceAI](https://paceai.co/software-requirements-specification-sample-format/)

[830-1998\_body.fm5](https://www.cse.msu.edu/~cse870/IEEEXplore-SRS-template.pdf?utm_source=chatgpt.com)

# User Manual

# ADET

# Proposal

**Submitted to:** Dr. Jayvee Christopher N. Vibar    
**Submitted by:** Avila, Clarissa A.  
   Bataller, Kristine Mae B.  
   Capitulo, Rein Allen M.  
   Orillana, Angel A.  
   Serra, Zsanleigh Peter F.  
**Year & Block:** 3C

**TITLE:** Artistryx: A Web-Based E-Commerce Platform for Early Childhood Learning Products  
**PROBLEM:** Parents and educators have limited access to age-appropriate, hands-on learning products to support different developmental needs, especially in outlying areas.  
**FEATURES:** Online product browsing, search functionality, shopping cart, checkout, user accounts, and order tracking.  
**TECH:** Next.js (React, TypeScript, CSS Modules), NestJS (Typescript), Prisma with SQL.  
**METHOD:** Hybrid of Waterfall and Scrum.

# Drafts

**TECH:** Next.js (App Router) with React on TypeScript and CSS Modules for the web frontend; NestJS (TypeScript) for backend APIs; Prisma with SQL to handle the database

**METHOD:** Hybrid of Waterfall and Scrum: fixed phases (requirements, design, implementation, testing, deployment) with short sprints, daily standups, and a product backlog inside each phase; milestones and deliverables per phase, with iterative delivery and feedback within implementation.