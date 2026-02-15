# 🧪 Manual Testing Guide - GC Finance Portal

## Purpose
This guide will help you test the app as if you're using it in real life. Follow these steps in order to make sure everything works correctly, looks good, and feels natural to use.

---

## 📋 Testing Checklist Overview

- [ ] **Phase 1**: First-Time Setup (Users & Volunteers)
- [ ] **Phase 2**: Financial Foundation (Bank Accounts)
- [ ] **Phase 3**: Income Flow (Donations)
- [ ] **Phase 4**: Planning (Drives & Budgets)
- [ ] **Phase 5**: Execution (Expenses & Cash Management)
- [ ] **Phase 6**: Monitoring (Dashboard & Reports)
- [ ] **Phase 7**: Forecasting (Projections)
- [ ] **Phase 8**: Edge Cases & Real-World Scenarios
- [ ] **Phase 9**: Design & User Experience Review

---

## 🎯 Phase 1: First-Time Setup (Users & Volunteers)

### Scenario: Your team is starting to use the app for the first time

#### Test 1.1: First User Sign-Up (Admin)
**What you're testing:** Can the first person create an account?

**Steps:**
1. Open the app in your browser
2. Click on "Sign Up" or "Create Account"
3. Enter email: `admin@gcfinance.com`
4. Enter password: `SecurePass123!`
5. Confirm password
6. Click Submit

**What to check:**
- [✅] Form is easy to understand
- [ ] Password requirements are clear
- [✅ ] Button is easy to find
- [ ] After signing up, you're taken to the right place (dashboard or confirmation page)
- [✅ ] You receive a confirmation email (if applicable)
- [✅] Error messages are helpful if something goes wrong

**Expected result:** You should successfully create an account and be able to log in.

---

#### Test 1.2: Additional Users Sign Up (Volunteers) ✅
**What you're testing:** Can other team members create accounts?

**Steps:**
1. Log out from the admin account
2. Have 3 other "volunteers" sign up with these accounts:
   - `volunteer1@gcfinance.com` - This person will handle cash
   - `volunteer2@gcfinance.com` - This person will handle cash
   - `volunteer3@gcfinance.com` - This person manages donations only

**What to check:**
- [ ] All three users can sign up successfully
- [ ] Each user can log in with their credentials
- [ ] Each user sees the dashboard after logging in

---

#### Test 1.3: View User Profiles
**What you're testing:** Can you see who's in your team?

**Steps:**
1. Log in as admin
2. Look for a "Settings" or "Users" or "Team" section
3. See if you can view the list of volunteers

**What to check:**
- [ ] Can you see all users who signed up?
- [ ] Is their information displayed clearly (name, email, role)?
- [ ] Can you identify who handles cash vs who doesn't?

**Note:** If there's no user management feature, write it down as a potential missing feature.

---

## 🏦 Phase 2: Financial Foundation (Bank Accounts) ✅

### Scenario: You need to add your organization's bank accounts with their current balances

#### Test 2.1: Add First Bank Account
**What you're testing:** Can you add a bank account with an opening balance?

**Steps:**
1. Navigate to "Bank Accounts" section
2. Click "Add Bank Account" or similar button
3. Enter details:
   - Bank Name: `Meezan Bank`
   - Account Name: `GC Charity Main Account`
   - Account Number: `0123456789`
   - Opening Balance: `50,000 PKR`
   - Opening Balance Date: `2026-02-01` (First day of current month)

**What to check:**
- [✅ ] Form is intuitive and easy to fill
- [ ✅] All fields are labeled clearly
- [ ✅] Currency selector shows PKR and other currencies
- [ ] Date picker is easy to use
- [ ] After saving, you see a success message
- [✅ ] The bank account appears in the list
- [ ✅] The balance shows correctly: PKR 50,000

---

#### Test 2.2: Add Multiple Bank Accounts 
**What you're testing:** Can you manage multiple bank accounts?

**Steps:**
Add two more bank accounts:

**Account 2:**
- Bank Name: `Bank Alfalah`
- Account Name: `GC Charity Operations`
- Account Number: `9876543210`
- Opening Balance: `75,000 PKR`
- Opening Balance Date: `2026-02-01`

**Account 3:**
- Bank Name: `HBL`
- Account Name: `GC Charity Emergency Fund`
- Account Number: `5555666677`
- Opening Balance: `100,000 PKR`
- Opening Balance Date: `2026-02-01`

**What to check:**
- [✅ ] All three accounts show in the list
- [✅ ] Each account shows the correct balance
- [ ✅] Total balance across all accounts is: PKR 225,000
- [✅ ] You can easily distinguish between accounts
- [ ] List is organized (by name, date added, or another logical order)

---

#### Test 2.3: View Bank Account Details
**What you're testing:** Can you see detailed information for each account?

**Steps:**
1. Click on "Meezan Bank" account
2. View the account details page

**What to check:**
- [ ] You see all account information (name, number, balance)
- [ ] You see transaction history (should show opening balance entry)
- [ ] The page is clean and easy to read
- [ ] There's a way to go back to the list

---

#### Test 2.4: Check Dashboard After Adding Accounts
**What you're testing:** Does the dashboard update automatically?

**Steps:**
1. Go to the Dashboard (main page)
2. Look for financial summary or total balance

**What to check:**
- [✅ ] Dashboard shows total bank balance: PKR 225,000
- [ ✅] The information is displayed clearly with charts or numbers
- [ ✅] It's immediately visible without scrolling too much
- [ ✅] Numbers match what you entered

---

## 💰 Phase 3: Income Flow (Donations)

### Scenario: Your volunteers are receiving donations from people

#### Test 3.1: Add Donor Information
**What you're testing:** Can you keep track of who's donating?

**Steps:**
1. Navigate to "Donors" section
2. Add a new donor:
   - Name: `Ahmed Khan`
   - Email: `ahmed.khan@email.com`
   - Phone: `+92-300-1234567`

3. Add another donor:
   - Name: `Fatima Ali`
   - Email: `fatima.ali@email.com`
   - Phone: `+92-321-9876543`

4. Add one more:
   - Name: `Bilal Sheikh`
   - Email: `bilal.sheikh@email.com`
   - Phone: `+92-333-5555666`

**What to check:**
- [ ✅] Form is simple and quick to fill
- [ ✅] All fields are optional except name (check if phone/email are required)
- [ ✅] After saving, donor appears in the list
- [ ] You can search for donors easily
- [ ] List shows key information at a glance

---

#### Test 3.2: Record Bank Donation (Direct Transfer)
**What you're testing:** Can you record when someone donates directly to your bank?

**Steps:**
1. Go to "Donations" section
2. Click "Add Donation" or "Record Donation"
3. Enter details:
   - Donor: Select `Ahmed Khan`
   - Amount: `10,000 PKR`
   - Type: `Bank` or `Bank Transfer`
   - Bank Account: Select `Meezan Bank`
   - Date: `2026-02-05`
   - Notes: `First donation for February`

**What to check:**
- [ ✅] Can easily select donor from dropdown
- [✅ ] Can specify donation type (bank vs cash)
- [✅ ] Can select which bank account received the money
- [✅ ] Date picker works smoothly
- [✅ ] After saving, you see success confirmation
- [✅ ] Donation appears in the donations list

---

#### Test 3.3: Record Cash Donation (Volunteer Receives)
**What you're testing:** Can you track when a volunteer receives cash?

**Steps:**
1. Still in "Donations" section
2. Add another donation:
   - Donor: Select `Fatima Ali`
   - Amount: `5,000 PKR`
   - Type: `Cash`
   - Received By: Select `volunteer1@gcfinance.com`
   - Date: `2026-02-06`
   - Notes: `Cash donation at event`

**What to check:**
- [✅ ] Cash option is clearly separate from bank
- [ ✅] You can select which volunteer received the cash
- [ ✅] Form adapts based on type (bank vs cash)
- [✅ ] All volunteers are available in the dropdown

---

#### Test 3.4: Record Multiple Donations (Various Scenarios) ✅
**What you're testing:** Does it handle different donation scenarios?

**Add these donations:**

**Donation 3:** Bank donation
- Donor: `Bilal Sheikh`
- Amount: `15,000 PKR`
- Type: Bank
- Account: `Bank Alfalah`
- Date: `2026-02-07`

**Donation 4:** Cash donation
- Donor: `Ahmed Khan` (donating again)
- Amount: `3,000 PKR`
- Type: Cash
- Received By: `volunteer2@gcfinance.com`
- Date: `2026-02-08`

**Donation 5:** Foreign currency donation
- Donor: `Fatima Ali`
- Amount: `100 USD`
- Type: Bank
- Account: `HBL`
- Date: `2026-02-09`
- Notes: `International donation`

**What to check:**
- [ ] Can record multiple donations quickly
- [ ] Each donation is saved correctly
- [ ] Foreign currency converts to PKR automatically
- [ ] Exchange rate is shown or used correctly
- [ ] List shows all donations with clear details

---

#### Test 3.5: Check Updated Balances ✅
**What you're testing:** Do the balances update automatically everywhere?

**Steps:**
1. Go to "Bank Accounts" section
2. Check each bank account balance
3. Go to "Cash Management" or "Volunteers" section
4. Check volunteer cash balances
5. Go to Dashboard

**What to check:**

**Bank Balances (should show):**
- [ ] Meezan Bank: 50,000 (opening) + 10,000 = **60,000 PKR**
- [ ] Bank Alfalah: 75,000 + 15,000 = **90,000 PKR**
- [ ] HBL: 100,000 + (100 USD converted) = **100,000 + ~30,000** = **~130,000 PKR** *(assuming 1 USD = 300 PKR)*
- [ ] Total Bank: **~280,000 PKR**

**Cash Balances (should show):**
- [ ] volunteer1: **5,000 PKR**
- [ ] volunteer2: **3,000 PKR**
- [ ] Total Cash: **8,000 PKR**

**Dashboard:**
- [ ] Total Money (Bank + Cash): **~288,000 PKR**
- [ ] Numbers match everywhere
- [ ] Dashboard updates without refreshing

---

#### Test 3.6: View Donation History ✅
**What you're testing:** Can you see a record of all donations?

**Steps:**
1. Go to "Donations" page
2. Look at the complete list

**What to check:**
- [ ✅] All 5 donations are visible
- [ ✅] You can see: donor name, amount, type (bank/cash), date
- [ ✅] List is sorted by date (most recent first makes sense)
- [ ] You can filter by type (bank only, cash only)
- [ ] You can search by donor name
- [ ] The total donations amount is shown somewhere

---

#### Test 3.7: View Individual Donor History ✅
**What you're testing:** Can you see what each person has donated over time?

**Steps:**
1. Go to "Donors" section
2. Click on `Ahmed Khan`

**What to check:**
- [ ✅] You see donor details
- [✅ ] You see all donations from Ahmed (should see 2: 10,000 bank + 3,000 cash)
- [✅ ] Total donated by Ahmed: **13,000 PKR**
- [✅ ] Dates are shown for each donation
- [✅ ] You can easily go back to donors list

**Repeat for other donors:**
- [✅ ] Fatima Ali: 5,000 cash + 100 USD bank = **5,000 + ~30,000** = **~35,000 PKR total**
- [✅ ] Bilal Sheikh: **15,000 PKR total**

---

#### Test 3.8: Cash Transfer Between Volunteers ✅
**What you're testing:** Can volunteers give cash to each other?

**Scenario:** Volunteer 2 gives some cash to Volunteer 1

**Steps:**
1. Go to "Cash Management" or similar section
2. Click "Transfer Cash" or "Record Transfer"
3. Enter:
   - From: `volunteer2@gcfinance.com`
   - To: `volunteer1@gcfinance.com`
   - Amount: `1,000 PKR`
   - Date: `2026-02-10`
   - Notes: `Transferring for event preparation`

**What to check:**
- [✅ ] Can select "from" and "to" volunteers
- [ ✅] Can't transfer to the same person (should show error)
- [ ] Can't transfer more than available balance (should show error)
- [✅ ] After transfer, balances update:
  - [✅ ] volunteer1: 5,000 + 1,000 = **6,000 PKR**
  - [ ✅] volunteer2: 3,000 - 1,000 = **2,000 PKR**
- [✅ ] Transfer appears in transaction history
- [✅ ] Both volunteers can see this transaction

---

#### Test 3.9: Cash Deposit to Bank ✅
**What you're testing:** Can you deposit cash from volunteer to bank account?

**Scenario:** Volunteer 1 deposits cash into Meezan Bank

**Steps:**
1. In "Cash Management" section
2. Click "Deposit to Bank" or similar
3. Enter:
   - From Volunteer: `volunteer1@gcfinance.com`
   - To Bank Account: `Meezan Bank`
   - Amount: `4,000 PKR`
   - Date: `2026-02-11`
   - Notes: `Weekly cash deposit`

**What to check:**
- [✅ ] Can select volunteer and bank account
- [ ] Can't deposit more than volunteer's cash balance
- [ ] After deposit, balances update:
  - [✅ ] volunteer1 cash: 6,000 - 4,000 = **2,000 PKR**
  - [ ✅] Meezan Bank: 60,000 + 4,000 = **64,000 PKR**
- [✅ ] Total money doesn't change (just moved from cash to bank)
- [✅ ] Transaction shows in both cash and bank history

---

#### Test 3.10: Check All Balances After Cash Movements ✅
**What you're testing:** Is everything still accurate?

**Go to Dashboard and verify:**

**Bank Balances:**
- [ ✅] Meezan Bank: **64,000 PKR**
- [✅ ] Bank Alfalah: **90,000 PKR**
- [✅ ] HBL: **~130,000 PKR**
- [ ✅] Total Bank: **~284,000 PKR**

**Cash Balances:**
- [✅ ] volunteer1: **2,000 PKR**
- [✅ ] volunteer2: **2,000 PKR**
- [✅ ] volunteer3: **0 PKR**
- [✅ ] Total Cash: **4,000 PKR**

**Grand Total: ~288,000 PKR** (should match before and after transfers/deposits)

- [ ✅] All numbers are correct
- [✅ ] Dashboard shows breakdown clearly
- [ ✅] You can see cash vs bank at a glance

---

## 🚗 Phase 4: Planning (Drives & Budgets)

### Scenario: You're planning Iftaar drives for the month

#### Test 4.1: Create Budget Template (Reusable)
**What you're testing:** Can you create a reusable budget template with items that automatically calculate based on headcount?

**Steps:**
1. Go to "Settings" page
2. Click on the "Templates" tab
3. Click "Create Template"
4. Enter template name: `Standard Iftaar Drive`
5. Add budget items one by one:

   **Item 1 - Variable (based on headcount):**
   - Description: `Dates - 1kg bags`
   - Category: `Food Items`
   - Type: `Variable` (radio button)
   - People per unit: `15` (15 people per 1kg bag)
   - Price per unit: `400`
   - Currency: `PKR`

   **Item 2 - Variable:**
   - Description: `Water bottles`
   - Category: `Food Items`
   - Type: `Variable`
   - People per unit: `1` (1 bottle per person)
   - Price per unit: `15`
   - Currency: `PKR`

   **Item 3 - Variable:**
   - Description: `Juice boxes`
   - Category: `Food Items`
   - Type: `Variable`
   - People per unit: `1` (1 box per person)
   - Price per unit: `30`
   - Currency: `PKR`

   **Item 4 - Fixed:**
   - Description: `Transportation`
   - Category: `Logistics`
   - Type: `Fixed` (radio button)
   - Price per unit: `2000`
   - Currency: `PKR`

   **Item 5 - Fixed:**
   - Description: `Garbage bags`
   - Category: `Miscellaneous`
   - Type: `Fixed`
   - Price per unit: `200`
   - Currency: `PKR`

6. Click "Create Template"

**What to check:**
- [ ✅] Template creation dialog is clear and easy to understand
- [ ✅] Can enter template name
- [✅ ] Can add multiple budget items using "Add Item" button
- [ ✅] Each item shows:
  - [ ✅] Description field
  - [ ✅] Category selector (searchable dropdown)
  - [ ✅] Type selector (Variable vs Fixed radio buttons)
  - [ ✅] For Variable: "People per unit" field appears
  - [ ]✅ For Fixed: "People per unit" field is hidden
  - [ ✅] Price per unit field
  - [✅ ] Currency dropdown (PKR, USD, etc.)
  - [ ✅] Exchange rate field (auto-fills based on currency)
  - [✅ ] Delete button (trash icon) to remove item
- [ ✅] Template is saved and appears in the Templates table
- [ ✅] Can remove unwanted items by clicking trash icon
- [✅ ] Table shows: template name, item count, variable/fixed breakdown
- [ ✅] Form is intuitive and well-organized

---

#### Test 4.2: Create First Drive Using Template
**What you're testing:** Can you create a drive and have the budget auto-calculate based on headcount?

**Steps:**
1. Go to "Drives & Causes" page
2. Under "Iftaar Drives" section, click "Add Drive"
3. In the dialog that opens:
   - Template: Select `Standard Iftaar Drive` from dropdown
   - Name: `Green Town Iftaar - Week 1`
   - Description: `Community iftaar at Green Town park`
   - Date: `2026-02-20`
   - Expected Headcount: `150`
   - Location: `Green Town Community Park`
4. Watch as budget items appear and calculate automatically

**What to check:**
- [✅ ] Template dropdown shows your created template
- [✅ ] When template is selected, budget items load automatically
- [ ✅] Each budget item shows as a card with:
  - [✅ ] Description and category name
  - [ ✅] Calculation explanation (e.g., "150 ÷ 15 = 10 units")
  - [ ✅] Line total in PKR
  - [ ✅] Edit and delete icons
- [ ✅] When you enter/change headcount:
  - [✅ ] Variable items recalculate instantly
  - [ ✅] Fixed items stay the same
  - [ ✅] Total budget updates automatically
- [ ✅] With 150 headcount, budget should show:
  - [ ✅] Dates: 150 ÷ 15 = 10 × 400 = **4,000 PKR**
  - [✅ ] Water: 150 ÷ 1 = 150 × 15 = **2,250 PKR**
  - [ ✅] Juice: 150 ÷ 1 = 150 × 30 = **4,500 PKR**
  - [ ✅] Transport: **2,000 PKR** (fixed)
  - [ ✅] Garbage bags: **200 PKR** (fixed)
  - [ ✅] **Total Budget: 12,950 PKR**
- [✅ ] Can click edit icon on any budget item to change details
- [✅ ] Can click delete icon to remove a budget item
- [✅ ] Can click "Add Item" to add manual budget items
- [✅ ] Form shows location and date fields
- [ ✅] Can create drive with "Create" button
- [ ✅] After creation, drive appears in the drives list as a card

---

#### Test 4.3: Edit Budget Item in Template Preview
**What you're testing:** Can you modify a budget item while creating a drive?

**Steps:**
1. While creating the Green Town drive (or create a new one)
2. After loading the template, click the Edit icon (pencil) on the "Water bottles" item
3. Change:
   - Price per unit from 15 to 20
4. Click "Update"

**What to check:**
- [✅ ] Edit dialog opens when clicking pencil icon
- [ ✅] Shows current values for that item
- [ ✅] Can change description, category, price, currency, people per unit
- [ ✅] After clicking "Update", dialog closes
- [ ✅] Budget item card updates with new values
- [✅ ] Total recalculates automatically
- [✅ ] Water now shows: 150 × 20 = **3,000 PKR**
- [✅ ] New total: 4,000 + 3,000 + 4,500 + 2,000 + 200 = **13,700 PKR**

---

#### Test 4.4: Add Manual Budget Item to Drive
**What you're testing:** Can you add extra budget items not in the template?

**Steps:**
1. While creating a drive, click "Add Item" button (even if using a template)
2. A new item appears (likely at the bottom)
3. Click the edit icon on this new item
4. Enter:
   - Description: `Paper plates and cups`
   - Category: `Miscellaneous`
   - Type: `Manual` (or you might see it calculate manually)
   - Quantity: `150`
   - Price per unit: `5`
   - Currency: `PKR`
5. Click "Update"

**What to check:**
- [ ✅] "Add Item" button works and adds a new item
- [ ✅] Manual item shows in the list
- [✅ ] Can edit it like other items
- [ ✅] Manual items calculate as: quantity × price
- [ ✅] Shows: 150 × 5 = **750 PKR**
- [ ✅] Total budget updates: **14,450 PKR**
- [ ✅] Can add multiple manual items

**Note:** The app might handle "manual" items differently than template items. Pay attention to how it works and document any differences.

---

#### Test 4.5: Create Drive Without Template (Manual Budget)
**What you're testing:** Can you create a drive without using any template?

**Steps:**
1. Go to "Drives & Causes" page
2. Click "Add Drive"
3. Leave Template dropdown as "None"
4. Enter:
   - Name: `Model Town Iftaar - Week 2`
   - Description: `Iftaar at Model Town Masjid`
   - Date: `2026-02-25`
   - Expected Headcount: `200`
   - Location: `Model Town Masjid`
5. Budget section should show "No budget items yet"
6. Click "Add Item" button
7. Add items manually (use the edit icon after adding):
   - Food package: 200 × 100 = 20,000 PKR
   - Transportation: 1 × 3,000 = 3,000 PKR
8. Click "Create"

**What to check:**
- [✅ ] Can create drive without selecting a template
- [ ✅] Budget section shows empty state message
- [ ✅] "Add Item" button is available
- [ ✅] Can build budget from scratch by adding items
- [ ✅] Manual items work correctly
- [ ✅] Total calculates: **23,000 PKR**
- [ ✅] Drive is created successfully

---

#### Test 4.6: View All Drives List
**What you're testing:** Can you see all your drives in an organized way?

**Steps:**
1. After creating 2+ drives, look at the "Drives & Causes" main page

**What to check:**
- [ ✅] Drives show as cards in a grid layout
- [ ✅] Each drive card shows:
  - [✅ ] Drive name (clickable link)
  - [ ✅] Description
  - [ ✅] Date with calendar icon
  - [ ✅] Location with map pin icon
  - [✅ ] Expected headcount with users icon
  - [ ✅] Budget summary (Budget, Spent, Remaining)
  - [ ✅] Edit button (pencil icon)
  - [ ]✅ Delete button (trash icon)
- [ ✅] Drives are organized clearly
- [ ✅] Easy to scan and find information
- [ ✅] Visual design is clean and professional

---

#### Test 4.7: Edit Drive Details (Change Headcount)
**What you're testing:** Can you update drive details after creation?

**Scenario:** Green Town drive headcount increased from 150 to 180

**Steps:**
1. Find "Green Town Iftaar - Week 1" drive card
2. Click the Edit icon (pencil)
3. Change Expected Headcount from `150` to `180`
4. Notice the message that appears about headcount change
5. Click "Recalculate Budget Items" button
6. Click "Save"

**What to check:**
- [ ] Edit dialog opens when clicking pencil icon
- [ ] Can change name, description, date, location, headcount
- [ ] When headcount changes, a special message appears saying:
  - "Headcount changed from 150 to 180"
  - Shows a "Recalculate Budget Items" button
- [ ] Clicking "Recalculate Budget Items":
  - [ ] Updates all variable budget items based on new headcount
  - [ ] Shows feedback (loading state or success message)
- [ ] After recalculation:
  - [ ] Dates: 180 ÷ 15 = 12 × 400 = **4,800 PKR**
  - [ ] Water: 180 × 20 = **3,600 PKR** (if you changed price earlier)
  - [ ] Juice: 180 × 30 = **5,400 PKR**
  - [ ] Transport: **2,000 PKR** (unchanged)
  - [ ] Garbage bags: **200 PKR** (unchanged)
  - [ ] Paper plates: still 150 × 5 = **750 PKR** (manual items don't auto-update)
  - [ ] **New Total: 16,750 PKR**
- [ ] Changes are saved when clicking "Save"
- [ ] Drive card updates with new information

**Important:** The app requires you to click a specific "Recalculate Budget Items" button to update variable budget items. It doesn't happen automatically when you change headcount.

---

#### Test 4.8: Reschedule a Drive
**What you're testing:** Can you easily change a drive's date?

**Steps:**
1. Find "Model Town Iftaar - Week 2"
2. Click Edit icon
3. Change date from `2026-02-25` to `2026-02-27`
4. Click "Save"

**What to check:**
- [✅ ] Date field is easy to use (date picker or text input)
- [ ✅] New date saves successfully
- [✅ ] Date shows correctly on the drive card
- [✅ ] Budget remains unchanged (only date changed)
- [ ✅] No errors or issues

---

#### Test 4.9: Delete a Drive
**What you're testing:** Can you remove a drive if plans are cancelled?

**Steps:**
1. Create a test drive: "Test Drive - Cancel This"
2. Find it in the list
3. Click the Delete icon (trash)
4. Confirm deletion in the dialog that appears

**What to check:**
- [ ✅] Delete dialog opens asking for confirmation
- [✅ ] Shows drive name in the confirmation message
- [ ✅] Has "Cancel" and "Delete" buttons
- [ ✅] Clicking "Cancel" closes dialog without deleting
- [ ✅] Clicking "Delete" removes the drive
- [ ✅] Drive disappears from the list immediately
- [ ✅] No errors occur

---

#### Test 4.10: Create "Other Cause" (Non-Drive)
**What you're testing:** Can you create other causes that aren't drives?

**Steps:**
1. On "Drives & Causes" page, scroll to "Other Causes" section
2. Click "Add Cause"
3. Enter:
   - Name: `Orphan Support Fund`
   - Description: `Monthly support for orphans`
4. Click "Create"

**What to check:**
- [✅ ] "Other Causes" section is separate from drives
- [ ✅] "Add Cause" button available in that section
- [✅ ] Other causes have simpler form (no date, location, headcount, budget)
- [ ✅] Just name and description
- [ ✅] Other causes appear in their own section
- [ ✅] Can edit and delete other causes similarly to drives
- [ ✅] Other causes shown in simpler list format (not cards)

---

#### Test 4.11: Edit Template After Creation
**What you're testing:** Can you modify a template you already created?

**Steps:**
1. Go to Settings → Templates tab
2. Find "Standard Iftaar Drive" template
3. Click Edit icon (pencil)
4. Add a new item:
   - Description: `Samosas`
   - Category: `Food Items`
   - Type: `Variable`
   - People per unit: `5` (5 people per samosa order)
   - Price per unit: `500`
   - Currency: `PKR`
5. Click "Save"

**What to check:**
- [ ✅] Edit dialog opens with all current template items
- [✅ ] Can modify existing items
- [✅ ] Can add new items using "Add Item" button
- [ ✅] Can remove items using trash icon
- [ ✅] Changes save successfully
- [ ✅] Template table updates
- [✅ ] **Important:** Existing drives that used this template are NOT updated
  - This is expected behavior - template changes only affect new drives

---

#### Test 4.12: Delete Template
**What you're testing:** Can you remove a template you no longer need?

**Steps:**
1. Create a test template: "Test Template - Delete Me"
2. Go to Settings → Templates
3. Click Delete icon (trash) on the test template
4. Confirm deletion

**What to check:**
- [✅ ] Delete confirmation dialog appears
- [✅ ] Shows template name
- [✅ ] Can cancel or confirm
- [ ✅] Template is removed from list
- [ ✅] **Important:** Check if drives created with this template still work
  - They should continue working normally
  - Budget items should remain intact

---

#### Test 4.13: Click on Drive Name to View Details
**What you're testing:** Can you see detailed information about a drive?

**Steps:**
1. On the Drives page, click on any drive name (it should be a link)

**What to check:**
- [ ✅] Clicking drive name navigates to a detail page
- [ ]✅ Detail page shows all drive information
- [ ✅] Shows budget breakdown
- [✅ ] **Document what you see on this page** - it might show expenses, donations, or other information we haven't tested yet

---

#### Test 4.14: Multi-Currency Support in Templates
**What you're testing:** Can you use different currencies in budget templates?

**Steps:**
1. Go to Settings → Currencies tab
2. Verify USD exists (or add it: code USD, symbol $, rate 278)
3. Go to Settings → Templates
4. Create new template: "International Relief Drive"
5. Add item with USD:
   - Description: `Medical supplies (imported)`
   - Category: `Medical`
   - Type: `Fixed`
   - Price per unit: `100`
   - Currency: `USD`
   - Exchange rate: Should auto-fill to 278 (or current USD rate)
6. Add item with PKR:
   - Description: `Local transportation`
   - Type: `Fixed`
   - Price per unit: `5000`
   - Currency: `PKR`
7. Save template
8. Create a drive using this template
9. Check if totals calculate correctly in PKR

**What to check:**
- [ ✅] Can select different currencies for different items
- [ ✅] Exchange rate auto-fills when currency is selected
- [✅ ] Can manually change exchange rate if needed
- [ ✅] When creating drive, total shows in PKR (base currency)
- [ ✅] Calculation: (100 USD × 278) + 5,000 PKR = **32,800 PKR**
- [ ✅] Budget items show original currency and PKR equivalent

---

## 💸 Phase 5: Execution (Expenses & Cash Management)

### Scenario: You're now executing the drives and making purchases

#### Test 5.1: Record Bank Expense (For Specific Drive)
**What you're testing:** Can you track money spent from bank for a drive?

**Scenario:** Buying dates for Green Town Iftaar from bank account

**Steps:**
1. Go to "Expenses" section
2. Click "Add Expense"
3. Enter:
   - Drive: Select `Green Town Iftaar - Week 1`
   - Category: `Food Items`
   - Description: `10 kg dates from Al-Rehman Store`
   - Amount: `4,000 PKR`
   - Payment Method: `Bank`
   - Bank Account: `Meezan Bank`
   - Date: `2026-02-18` (2 days before drive)
   - Receipt/Invoice: (optional) Upload if feature exists

**What to check:**
- [✅] Can select the drive from dropdown
- [✅] Can select expense category
- [ ✅] Can enter clear description
- [ ✅] Can choose payment method (bank vs cash)
- [✅ ] Can select which bank account
- [ ] Date is before or on drive date
- [ ✅] After saving, expense appears in list
- [ ✅] Bank balance updates: Meezan Bank: 64,000 - 4,000 = **60,000 PKR**

---

#### Test 5.2: Record Cash Expense (Volunteer Spends)
**What you're testing:** Can you track when a volunteer spends cash?

**Scenario:** Volunteer 1 buys water bottles with their cash

**Steps:**
1. Add another expense:
   - Drive: `Green Town Iftaar - Week 1`
   - Category: `Food Items`
   - Description: `150 water bottles from Local Store`
   - Amount: `2,250 PKR`
   - Payment Method: `Cash`
   - Paid By: `volunteer1@gcfinance.com`
   - Date: `2026-02-19`

**What to check:**
- [✅] Can select cash payment
- [ ✅] Can select which volunteer paid
- [ ✅] After saving, volunteer cash balance updates:
  - [ ✅] volunteer1: 2,000 - 2,250 = **-250 PKR** (negative! volunteer spent more than they had)
- [✅ ] System handles negative balance (volunteer is owed money)
- [ ✅] Expense shows in list

---

#### Test 5.3: Reimburse Volunteer (Give Cash Back)
**What you're testing:** Can you give money back to a volunteer who spent their own or went negative?

**Scenario:** Give volunteer 1 cash from volunteer 2

**Steps:**
1. Go to "Cash Management"
2. Transfer:
   - From: `volunteer2@gcfinance.com`
   - To: `volunteer1@gcfinance.com`
   - Amount: `500 PKR`
   - Date: `2026-02-19`
   - Notes: `Reimbursing for water bottles expense`

**What to check:**
- [✅ ] Transfer works even when recipient has negative balance
- [ ✅] Balances update:
  - [✅ ] volunteer1: -250 + 500 = **250 PKR** (now positive)
  - [ ✅] volunteer2: 2,000 - 500 = **1,500 PKR**
- [ ✅] Transaction shows clearly who sent and who received
- [✅ ] Notes help explain the purpose

---

#### Test 5.4: Record Multiple Expenses (Complete Drive)
**What you're testing:** Can you record all expenses for a drive?

**Continue adding expenses for Green Town Iftaar:**

**Expense 3:**
- Drive: Green Town Iftaar
- Category: Food Items
- Description: `150 juice boxes`
- Amount: `4,500 PKR`
- Method: Bank
- Account: Bank Alfalah
- Date: 2026-02-19

**Expense 4:**
- Drive: Green Town Iftaar
- Category: Logistics
- Description: `30 carpets rental`
- Amount: `3,000 PKR`
- Method: Bank
- Account: Bank Alfalah
- Date: 2026-02-19

**Expense 5:**
- Drive: Green Town Iftaar
- Category: Logistics
- Description: `Transportation and setup`
- Amount: `2,000 PKR`
- Method: Cash
- Paid by: volunteer2
- Date: 2026-02-20 (day of drive)

**Expense 6:**
- Drive: Green Town Iftaar
- Category: Miscellaneous
- Description: `Paper plates, cups, napkins`
- Amount: `750 PKR`
- Method: Cash
- Paid by: volunteer2
- Date: 2026-02-20

**Expense 7:**
- Drive: Green Town Iftaar
- Category: Miscellaneous
- Description: `Garbage bags and cleaning supplies`
- Amount: `200 PKR`
- Method: Cash
- Paid by: volunteer2
- Date: 2026-02-20

**What to check:**
- [ ✅] All expenses are recorded successfully
- [ ✅] Total spent on Green Town Iftaar: 4,000 + 2,250 + 4,500 + 3,000 + 2,000 + 750 + 200 = **16,700 PKR**
- [ ] This matches the budgeted amount: **19,000 PKR** (we're under budget by 2,300 PKR!)
- [ ✅] Bank balances update:
  - [ ✅] Meezan Bank: 60,000 PKR (already deducted 4,000)
  - [✅ ] Bank Alfalah: 90,000 - 4,500 - 3,000 = **82,500 PKR**
  - [✅ ] HBL: ~130,000 PKR (unchanged)
- [✅ ] Volunteer cash balances:
  - [ ✅] volunteer1: 250 PKR (from before)
  - [ ✅] volunteer2: 1,500 - 2,000 - 750 - 200 = **-1,450 PKR** (needs reimbursement!)

---

#### Test 5.5: View Budget vs Actual for Drive
**What you're testing:** Can you see how much you planned vs how much you actually spent?

**Steps:**
1. Go to "Green Town Iftaar - Week 1" drive details
2. Look for "Budget vs Actual" or similar section

**What to check:**
- [ ✅] Shows budget amount: **19,000 PKR**
- [✅ ] Shows actual spent: **16,700 PKR**
- [✅ ] Shows difference: **2,300 PKR under budget** (savings!)
- [✅ ] Shows breakdown by category:
  - [✅ ] Food Items: Budgeted 12,300, Spent 10,750
  - [✅ ] Logistics: Budgeted 5,000, Spent 5,000
  - [ ✅] Miscellaneous: Budgeted 950, Spent 950
- [ ✅] Visual indicator (green for under budget, red for over budget)
- [ ✅] Clear and easy to understand
- [ ✅] Can see which categories are on track

---

#### Test 5.6: Mark Drive as Complete
**What you're testing:** Can you finalize a drive after it's done?

**Steps:**
1. Still on Green Town Iftaar drive
2. Click "Mark as Complete" or "Finish Drive"
3. Confirm

**What to check:**
- [ ] Drive status changes to "Completed"
- [ ] Drive moves to "Completed Drives" section or is marked differently
- [ ] Drive still shows in history/reports
- [ ] Can't add more expenses after completion (or shows warning)
- [ ] Budget vs actual is finalized
- [ ] Savings (2,300 PKR) is noted

---

#### Test 5.7: Record Expenses for Another Drive
**What you're testing:** Can you manage expenses for multiple drives?

**Scenario:** Urgent Iftaar happens on Feb 15, record its expenses

**Add these expenses:**

**Expense 1:**
- Drive: Urgent Iftaar - Local Masjid
- Category: Food Items
- Description: `Combined food package (dates, water, snacks)`
- Amount: `8,500 PKR`
- Method: Bank
- Account: HBL
- Date: 2026-02-15

**Expense 2:**
- Drive: Urgent Iftaar
- Category: Logistics
- Description: `Carpet rental and transport`
- Amount: `2,500 PKR`
- Method: Cash
- Paid by: volunteer1
- Date: 2026-02-15

**What to check:**
- [ ✅] Can select different drive
- [✅ ] Expenses are tracked separately per drive
- [ ✅] Balances update correctly:
  - [ ✅] HBL: ~128,000 - 8,500 = **~121,500 PKR**
  - [ ✅] volunteer1: 250 - 2,500 = **-2,250 PKR** (needs reimbursement)

---

#### Test 5.8: Withdraw Cash from Bank for Expenses
**What you're testing:** Can you take cash from bank to have on hand?

**Scenario:** You need to give volunteers cash for upcoming expenses

**Steps:**
1. Go to "Cash Management"
2. Click "Withdraw from Bank" or similar (this is reverse of deposit)
3. Enter:
   - From Bank: `Bank Alfalah`
   - To Volunteer: `admin@gcfinance.com` (yourself)
   - Amount: `10,000 PKR`
   - Date: `2026-02-19`
   - Notes: `Cash withdrawal for upcoming drive expenses`

**What to check:**
- [ ] Can withdraw cash from bank
- [ ] Bank balance decreases: Bank Alfalah: 82,500 - 10,000 = **72,500 PKR**
- [ ] Admin/volunteer cash balance increases: **10,000 PKR**
- [ ] Total money stays the same (just moved from bank to cash)
- [ ] Transaction shows in both bank and cash history

**Note:** If there's no separate withdraw feature, this might be done through "cash transfer" or "reverse deposit". Document how it works.

---

#### Test 5.9: Distribute Cash to Multiple Volunteers
**What you're testing:** Can you give cash to volunteers who will handle expenses?

**Steps:**
1. Transfer cash to volunteers:

**Transfer 1:**
- From: admin@gcfinance.com
- To: volunteer1@gcfinance.com
- Amount: 5,000 PKR
- Date: 2026-02-19
- Notes: `For Model Town Iftaar expenses`

**Transfer 2:**
- From: admin@gcfinance.com
- To: volunteer2@gcfinance.com
- Amount: 3,000 PKR
- Date: 2026-02-19
- Notes: `For Emergency Relief drive`

**What to check:**
- [ ] Multiple transfers work smoothly
- [ ] Balances update correctly:
  - [ ] Admin: 10,000 - 5,000 - 3,000 = **2,000 PKR**
  - [ ] volunteer1: -2,250 + 5,000 = **2,750 PKR** (now positive!)
  - [ ] volunteer2: -1,450 + 3,000 = **1,550 PKR** (now positive!)
- [ ] All volunteers now have positive balances
- [ ] History shows clear flow of cash

---

#### Test 5.10: Check Overall Financial Status
**What you're testing:** Is everything still accurate after all these transactions?

**Go to Dashboard and verify:**

**Bank Balances (updated):**
- [ ] Meezan Bank: **60,000 PKR**
- [ ] Bank Alfalah: **72,500 PKR**
- [ ] HBL: **~119,500 PKR**
- [ ] Total Bank: **~252,000 PKR**

**Cash Balances (updated):**
- [ ] Admin: **2,000 PKR**
- [ ] volunteer1: **2,750 PKR**
- [ ] volunteer2: **1,550 PKR**
- [ ] volunteer3: **0 PKR**
- [ ] Total Cash: **6,300 PKR**

**Grand Total: ~258,300 PKR**

**Money Spent So Far:**
- [ ] Green Town Iftaar (completed): **16,700 PKR**
- [ ] Urgent Iftaar (completed): **11,000 PKR**
- [ ] Total Spent: **27,700 PKR**

**Starting Balance:** ~286,000 PKR
**After Expenses:** 286,000 - 27,700 = **~258,300 PKR** ✓ Matches!

- [ ] All calculations are correct
- [ ] Dashboard shows this breakdown clearly
- [ ] No money is lost or unaccounted for

---

## 📊 Phase 6: Monitoring (Dashboard & Reports)

### Scenario: You need to review your financial status and generate reports

#### Test 6.1: Dashboard Overview
**What you're testing:** Is the dashboard giving you a clear picture?

**Steps:**
1. Go to Dashboard (main page after login)
2. Review all information displayed

**What to check:**

**Financial Summary Section:**
- [ ] Shows total balance: **~258,300 PKR**
- [ ] Shows bank balance: **~252,000 PKR**
- [ ] Shows cash balance: **6,300 PKR**
- [ ] Shows total donations received: **~286,000 PKR**
- [ ] Shows total expenses: **27,700 PKR**
- [ ] Shows remaining after expenses: **~258,300 PKR**

**Drives Summary Section:**
- [ ] Shows active/planned drives: **2 drives** (Model Town, Emergency Relief)
- [ ] Shows completed drives: **2 drives** (Green Town, Urgent Iftaar)
- [ ] Shows cancelled drives: **1 drive** (Johar Town)
- [ ] Shows upcoming drive dates
- [ ] Shows budget for planned drives: **106,000 PKR**

**Donors Summary:**
- [ ] Shows total donors: **3 donors**
- [ ] Shows top donors or recent donations
- [ ] Clear visualization of donation trends

**Charts & Visualizations:**
- [ ] Income vs expenses chart (bar or line chart)
- [ ] Donations by type (bank vs cash) - pie chart
- [ ] Expenses by category - pie chart
- [ ] Drive budget vs actual - comparison chart
- [ ] Charts are clear and labeled properly
- [ ] Colors are distinguishable
- [ ] Data is accurate

**Overall Design:**
- [ ] Layout is clean and not cluttered
- [ ] Most important information is visible without scrolling
- [ ] Easy to understand at a glance
- [ ] Dark mode works properly (if available)
- [ ] Numbers are formatted clearly (with commas, currency symbols)

---

#### Test 6.2: Reports Page
**What you're testing:** Can you generate and export reports?

**Steps:**
1. Go to "Reports" section
2. Look at available report types

**What to check:**
- [ ] Report page lists different report types:
  - [ ] Donations Report
  - [ ] Expenses Report
  - [ ] Bank Account Balances
  - [ ] Volunteer Cash Balances
  - [ ] Drive Financial Summary
  - [ ] Budget vs Actual Report

**For each report type, check:**
- [ ] Can filter by date range
- [ ] Can filter by specific drive
- [ ] Can filter by category
- [ ] Shows summary totals
- [ ] Data is accurate
- [ ] Can export to CSV
- [ ] Can export to PDF (if available)

---

#### Test 6.3: Generate Donations Report
**What you're testing:** Can you get a complete list of all donations?

**Steps:**
1. In Reports section, select "Donations Report"
2. Set date range: `2026-02-01` to `2026-02-28`
3. View report or export as CSV

**What to check:**
- [ ] Shows all 5 donations
- [ ] Columns include: Date, Donor, Amount, Currency, PKR Amount, Type (Bank/Cash), Account/Volunteer
- [ ] Sorted by date
- [ ] Total donations shown: **~286,000 PKR**
- [ ] Breakdown: Bank vs Cash
- [ ] CSV export works and opens correctly in Excel/Google Sheets
- [ ] All data is present in export

---

#### Test 6.4: Generate Expenses Report
**What you're testing:** Can you get a complete list of all expenses?

**Steps:**
1. Select "Expenses Report"
2. Set date range: `2026-02-01` to `2026-02-28`
3. View/export

**What to check:**
- [ ] Shows all expenses (should be 9 total: 7 for Green Town + 2 for Urgent Iftaar)
- [ ] Columns: Date, Drive, Category, Description, Amount, Payment Method, Account/Volunteer
- [ ] Total expenses: **27,700 PKR**
- [ ] Can filter by specific drive
- [ ] Can filter by category
- [ ] Can filter by payment method (bank vs cash)
- [ ] Export works correctly

---

#### Test 6.5: Generate Drive Financial Summary
**What you're testing:** Can you see financial overview for each drive?

**Steps:**
1. Select "Drive Financial Summary" report
2. View all drives

**What to check:**
- [ ] Lists all drives (including cancelled and completed)
- [ ] For each drive shows:
  - [ ] Drive name, date, location
  - [ ] Status (completed, planned, cancelled)
  - [ ] Budgeted amount
  - [ ] Actual spent (for completed drives)
  - [ ] Variance (under/over budget)
  - [ ] Remaining to spend (for planned drives)

**Specifically check:**
- [ ] Green Town Iftaar: Budget 19,000, Spent 16,700, Under budget 2,300 ✓
- [ ] Urgent Iftaar: Budget 11,000, Spent 11,000, On budget ✓
- [ ] Model Town Iftaar: Budget 22,000, Spent 0 (not yet executed)
- [ ] Emergency Relief: Budget 65,000, Spent 0 (not yet executed)
- [ ] Johar Town (cancelled): Budget 0 or marked N/A

- [ ] Summary totals are correct
- [ ] Export includes all drives

---

#### Test 6.6: View Bank Account Statements
**What you're testing:** Can you see transaction history for each bank account?

**Steps:**
1. Go to "Bank Accounts"
2. Click on "Meezan Bank"
3. View transaction history/statement

**What to check:**
- [ ] Shows opening balance: **50,000 PKR**
- [ ] Shows all transactions in order:
  - [ ] Donation from Ahmed Khan: +10,000
  - [ ] Cash deposit from volunteer1: +4,000
  - [ ] Expense for Green Town (dates): -4,000
- [ ] Running balance is shown for each transaction:
  - [ ] 50,000 → 60,000 → 64,000 → 60,000
- [ ] Current balance: **60,000 PKR** ✓
- [ ] Can export statement as CSV/PDF
- [ ] Transactions are clearly described

**Repeat for other banks:**
- [ ] Bank Alfalah statement is correct
- [ ] HBL statement is correct

---

#### Test 6.7: View Volunteer Cash Balances
**What you're testing:** Can you see each volunteer's cash position?

**Steps:**
1. Go to "Cash Management" or "Reports"
2. View "Volunteer Cash Balances" report

**What to check:**
- [ ] Shows all volunteers with cash activity:
  - [ ] Admin: **2,000 PKR**
  - [ ] volunteer1: **2,750 PKR**
  - [ ] volunteer2: **1,550 PKR**
  - [ ] volunteer3: **0 PKR** (or not shown if no activity)
- [ ] Total cash: **6,300 PKR** ✓
- [ ] Shows transaction history for each volunteer
- [ ] Can see who owes whom (if someone is negative)
- [ ] Clear and easy to reconcile

---

## 🔮 Phase 7: Forecasting (Projections)

### Scenario: It's mid-month, you want to know how many more drives you can do

#### Test 7.1: View Current Financial Position
**What you're testing:** Does the projection page show your current status?

**Steps:**
1. Go to "Projections" or "Financial Forecasting" section
2. View current position

**What to check:**
- [ ] Shows current date: **February 20, 2026** (or whatever you set as "today")
- [ ] Shows available balance: **~258,300 PKR**
- [ ] Shows planned drives: **2 drives** (Model Town, Emergency Relief)
- [ ] Shows committed funds: **87,000 PKR** (22,000 + 65,000)
- [ ] Shows remaining after committed: **~171,300 PKR**
- [ ] Clear visualization of funds allocation

---

#### Test 7.2: Calculate How Many More Drives Possible
**What you're testing:** Can you see how many additional drives you can afford?

**Steps:**
1. In Projections section, look for "Drive Runway" or "How Many More Drives" calculator
2. Select drive type: `Standard Iftaar Drive`
3. Set parameters: Headcount 150, Carpets 30
4. Estimated cost per drive: ~16,700 PKR

**What to check:**
- [ ] Calculator shows cost per drive based on template: **~16,700 PKR**
- [ ] Calculator shows remaining funds: **~171,300 PKR**
- [ ] Calculator shows: **Can do approximately 10 more drives** (171,300 ÷ 16,700)
- [ ] Visual indicator (progress bar, chart) showing utilization
- [ ] Can adjust parameters and see real-time updates

---

#### Test 7.3: Play With Different Drive Scenarios
**What you're testing:** Can you model different scenarios?

**Try these scenarios:**

**Scenario A: Larger Drives**
- Headcount: 250
- Carpets: 50
- Cost per drive: ~27,500 PKR
- How many possible: **171,300 ÷ 27,500 = ~6 drives**

**Scenario B: Smaller Drives**
- Headcount: 100
- Carpets: 20
- Cost per drive: ~11,000 PKR
- How many possible: **171,300 ÷ 11,000 = ~15 drives**

**Scenario C: Mixed**
- 3 large drives (250 people): 3 × 27,500 = 82,500
- Remaining: 171,300 - 82,500 = 88,800
- Small drives possible: 88,800 ÷ 11,000 = ~8 drives
- **Total: 3 large + 8 small = 11 drives**

**What to check:**
- [ ] Can easily change parameters
- [ ] Calculations update instantly
- [ ] Shows breakdown of funds usage
- [ ] Can compare multiple scenarios side-by-side
- [ ] Can save scenarios for reference (if feature exists)

---

#### Test 7.4: Check Impact of Expected Donations
**What you're testing:** Can you factor in future donations?

**Scenario:** You expect to receive 50,000 PKR more in donations this month

**Steps:**
1. In Projections, find "Expected Donations" or similar field
2. Enter: `50,000 PKR`
3. See updated projections

**What to check:**
- [ ] Available balance updates: ~171,300 + 50,000 = **~221,300 PKR**
- [ ] Number of possible drives increases
- [ ] For standard drives: 221,300 ÷ 16,700 = **~13 drives**
- [ ] Shows "projected balance" vs "current balance" separately
- [ ] Clear indication this is a forecast

---

#### Test 7.5: View Timeline/Cashflow Forecast
**What you're testing:** Can you see when money will be spent?

**Steps:**
1. Look for "Cashflow Timeline" or "Spending Forecast"
2. View projected spending for upcoming drives

**What to check:**
- [ ] Shows planned drives on a timeline:
  - [ ] Feb 27: Model Town (22,000 PKR)
  - [ ] Feb 28: Emergency Relief (65,000 PKR)
- [ ] Shows projected balance after each drive:
  - [ ] After Model Town: ~236,300 PKR
  - [ ] After Emergency Relief: ~171,300 PKR
- [ ] Visual chart (line graph) showing balance over time
- [ ] Can see if balance ever goes negative (warning!)
- [ ] Can add hypothetical drives to see impact

---

## 🧩 Phase 8: Edge Cases & Real-World Scenarios

### Testing unusual situations and error handling

#### Test 8.1: Try Invalid Data Entry
**What you're testing:** Does the app handle errors gracefully?

**Try these invalid inputs:**

**A. Negative amount donation:**
- Go to Donations
- Try to enter amount: `-5000`
- **Expected:** Error message: "Amount must be positive"

**B. Future date donation:**
- Try to add donation with date in the future: `2027-01-01`
- **Expected:** Warning or error: "Date cannot be in future" OR allows with warning

**C. Transfer more cash than available:**
- Try to transfer 50,000 PKR from volunteer who has only 2,000
- **Expected:** Error: "Insufficient balance"

**D. Empty required fields:**
- Try to submit forms without filling required fields
- **Expected:** Clear error messages for each missing field

**E. Invalid email format:**
- Try to add donor with email: `notanemail`
- **Expected:** Error: "Invalid email format"

**What to check:**
- [ ] All validation errors are shown clearly
- [ ] Error messages are helpful (not technical jargon)
- [ ] Form doesn't submit with invalid data
- [ ] User can fix errors easily
- [ ] No crashes or blank pages

---

#### Test 8.2: Delete/Remove Records
**What you're testing:** What happens when you delete things?

**Try deleting:**

**A. Delete a donation:**
- Go to donations list
- Try to delete one donation
- **Expected:** Confirmation dialog: "Are you sure?"
- After deleting: Balance updates correctly

**B. Delete a bank account:**
- Try to delete a bank account that has transactions
- **Expected:** Error or warning: "Cannot delete account with transactions" OR "This will affect X transactions"

**C. Delete a drive:**
- Try to delete Model Town drive
- **Expected:** Confirmation, and expenses linked to it are handled (orphaned or deleted)

**What to check:**
- [ ] Deletion requires confirmation
- [ ] Can't delete if it breaks data integrity
- [ ] Related records are handled properly
- [ ] Balances recalculate after deletion
- [ ] Can undo deletion (if soft delete is used)
- [ ] Deleted items don't disappear completely from history

---

#### Test 8.3: Concurrent Operations (Multiple Users)
**What you're testing:** What if two people work at the same time?

**Scenario:** Two volunteers log in simultaneously

**Steps:**
1. Open app in two different browser windows/tabs
2. Log in as `volunteer1` in window 1
3. Log in as `volunteer2` in window 2

**Try these scenarios:**

**A. Both record donations at same time:**
- volunteer1 adds donation: 10,000 PKR to Meezan Bank
- volunteer2 adds donation: 5,000 PKR to Meezan Bank
- **Check:** Both donations are saved, balance is correct (sum of both)

**B. Both try to transfer same cash:**
- volunteer1 transfers 1,000 from their cash to admin
- volunteer2 transfers 1,000 from their cash to admin
- **Check:** Both succeed, balances are correct

**C. One adds expense, other views dashboard:**
- volunteer1 adds large expense
- volunteer2 refreshes dashboard
- **Check:** volunteer2 sees updated balance

**What to check:**
- [ ] No data is lost
- [ ] No duplicate entries
- [ ] Balances are always correct
- [ ] No conflicts or errors
- [ ] Real-time updates or clear refresh needed

---

#### Test 8.4: Very Long Text Inputs
**What you're testing:** Can the app handle long descriptions?

**Try entering:**
- Drive name: (very long, 200+ characters)
- Expense description: (multiple paragraphs)
- Notes field: (very detailed explanation)

**What to check:**
- [ ] Text doesn't break the layout
- [ ] Long text is truncated or wrapped properly
- [ ] Can still read full text (tooltip, expand button, or detail page)
- [ ] Character limits are enforced (if any)
- [ ] No horizontal scrolling

---

#### Test 8.5: Duplicate Entries
**What you're testing:** What if same thing is entered twice?

**Try these:**

**A. Add same donor twice:**
- Add donor: "Ahmed Khan"
- Try to add another: "Ahmed Khan" (exact same name)
- **Expected:** Warning: "Donor already exists" OR allows but shows warning

**B. Add same bank account twice:**
- Try adding Meezan Bank again with same account number
- **Expected:** Error: "Account already exists"

**C. Record same expense twice:**
- Add expense, then immediately add same expense again
- **Check:** Both are saved (might be intentional) OR warning shown

**What to check:**
- [ ] System detects obvious duplicates
- [ ] User is warned before creating duplicates
- [ ] Can proceed if it's intentional (not always an error)

---

#### Test 8.6: Export Large Datasets
**What you're testing:** Can you export a lot of data?

**Steps:**
1. Go to Reports
2. Export "All Transactions" or "Complete Ledger" (if available)
3. Download CSV/PDF

**What to check:**
- [ ] Export completes without timeout
- [ ] File downloads successfully
- [ ] File opens correctly in Excel/PDF reader
- [ ] All data is present (no truncation)
- [ ] Formatting is preserved
- [ ] File size is reasonable

---

#### Test 8.7: Work Offline Then Come Back Online
**What you're testing:** What if internet connection drops?

**Steps:**
1. While using app, disconnect internet (turn off WiFi)
2. Try to add a donation or expense
3. Reconnect internet

**What to check:**
- [ ] Shows clear error: "No internet connection"
- [ ] Data entered is not lost (saved locally if possible)
- [ ] When back online, can retry or data syncs
- [ ] No crashes or confusing errors

---

#### Test 8.8: Session Timeout
**What you're testing:** What if you leave the app open for hours?

**Steps:**
1. Log in and use the app
2. Leave it idle for 30+ minutes (or configured timeout)
3. Try to perform an action

**What to check:**
- [ ] Session expires after reasonable time
- [ ] User is redirected to login page
- [ ] Clear message: "Session expired, please log in again"
- [ ] After logging in, user returns to where they were (if possible)
- [ ] No data is lost

---

## 🎨 Phase 9: Design & User Experience Review

### Testing if the app is intuitive and pleasant to use

#### Test 9.1: First Impressions
**What you're testing:** How does it feel when you first open the app?

**Steps:**
1. Open the app as a new user
2. Look at login/signup page

**What to check:**
- [ ] Branding is clear (logo, name)
- [ ] Login form is simple and centered
- [ ] Button labels are clear: "Login" not "Submit"
- [ ] "Forgot password?" and "Sign up" links are visible
- [ ] Page looks professional and trustworthy
- [ ] No spelling errors or typos
- [ ] Loading is fast (under 2 seconds)

---

#### Test 9.2: Navigation & Menu Structure
**What you're testing:** Is it easy to find things?

**Check the menu/sidebar:**

**Menu items should be:**
- [ ] Organized logically (grouped by category)
- [ ] Labeled clearly (no technical jargon)
- [ ] Icons match their function
- [ ] Current page is highlighted
- [ ] Can collapse/expand (if sidebar)
- [ ] Mobile-friendly (hamburger menu on small screens)

**Suggested grouping makes sense:**
- Dashboard (home)
- Income: Donations, Donors
- Expenses: Expenses, Cash Management
- Planning: Drives, Drive Templates
- Banking: Bank Accounts
- Reports & Projections
- Settings

- [ ] Menu structure is intuitive
- [ ] Can navigate anywhere within 2-3 clicks

---

#### Test 9.3: Forms & Input Fields
**What you're testing:** Are forms easy to fill?

**Check all forms in the app:**

**Form design:**
- [ ] Fields are properly labeled (above or beside)
- [ ] Required fields are marked with * or "required"
- [ ] Input fields are appropriately sized (not too small)
- [ ] Dropdowns show all options clearly
- [ ] Date pickers are easy to use (calendar view)
- [ ] Amount fields accept only numbers
- [ ] Currency is shown clearly (PKR 10,000 not just 10000)
- [ ] Tab key moves through fields in logical order

**Form behavior:**
- [ ] Save/Submit buttons are prominent
- [ ] Cancel/Back buttons are available but less prominent
- [ ] Success messages are clear and positive
- [ ] Error messages are specific and helpful
- [ ] Form doesn't clear if there's an error (can fix without re-entering)
- [ ] Loading indicators show when saving

---

#### Test 9.4: Lists & Tables
**What you're testing:** Is data displayed clearly?

**Check all list/table views:**

**Donations, Expenses, Drives, Donors, Bank Accounts lists:**

**Table design:**
- [ ] Columns are clearly labeled
- [ ] Important info is visible without scrolling horizontally
- [ ] Rows have enough spacing (not cramped)
- [ ] Alternating row colors (easier to read)
- [ ] Hover effects show which row you're on
- [ ] Click to view details works intuitively

**Table features:**
- [ ] Can sort by columns (click header to sort)
- [ ] Can search/filter
- [ ] Shows count: "Showing 10 of 50 donations"
- [ ] Pagination works if many items (previous/next)
- [ ] Can change items per page (10, 25, 50, 100)

**Mobile responsiveness:**
- [ ] Tables adapt on small screens (cards or collapsible rows)
- [ ] All info is still accessible
- [ ] No horizontal scrolling required

---

#### Test 9.5: Dashboard Layout & Widgets
**What you're testing:** Is the dashboard informative at a glance?

**Dashboard sections:**

**A. Summary Cards (at top):**
- [ ] Show key metrics: Total Balance, Donations, Expenses, Upcoming Drives
- [ ] Numbers are large and prominent
- [ ] Use colors meaningfully (green for income, red for expenses)
- [ ] Icons match the metric
- [ ] Cards are same size and aligned

**B. Charts:**
- [ ] Charts are labeled with clear titles
- [ ] Axes are labeled (X = date, Y = amount)
- [ ] Legend explains colors/lines
- [ ] Tooltips show exact values on hover
- [ ] Colors are accessible (not just red/green for colorblind users)
- [ ] Charts resize on smaller screens

**C. Quick Actions:**
- [ ] "Add Donation", "Add Expense", "Create Drive" buttons are visible
- [ ] Buttons are styled as calls-to-action (colored, prominent)

**D. Recent Activity:**
- [ ] Shows last 5-10 transactions
- [ ] Each item shows: date, type, amount, description
- [ ] Link to view full history

**Overall:**
- [ ] Most important info is "above the fold" (visible without scrolling)
- [ ] Layout is balanced (not all on one side)
- [ ] White space is used well (not cluttered)
- [ ] Page loads fast even with charts

---

#### Test 9.6: Color Scheme & Theme
**What you're testing:** Does it look good and consistent?

**Check colors:**
- [ ] Color palette is consistent throughout app
- [ ] Colors have meaning: green = success/income, red = error/expense, blue = info, yellow = warning
- [ ] Text has good contrast against background (readable)
- [ ] Links are distinguishable (underlined or colored)
- [ ] Buttons stand out from regular text

**Check dark mode (if available):**
- [ ] Toggle between light and dark mode
- [ ] Dark mode is actually dark (not gray)
- [ ] Text is still readable (light text on dark background)
- [ ] All pages and components support dark mode
- [ ] Charts adjust colors for dark mode
- [ ] No white flashes when switching

---

#### Test 9.7: Responsive Design (Mobile & Tablet)
**What you're testing:** Does it work on different screen sizes?

**Test on different devices:**

**Mobile (phone):**
- [ ] Menu becomes hamburger icon
- [ ] Tables become cards or vertical lists
- [ ] Forms are single column
- [ ] Buttons are large enough to tap (not tiny)
- [ ] No horizontal scrolling
- [ ] Text is readable (not too small)
- [ ] Charts resize and remain readable

**Tablet:**
- [ ] Layout adapts (sidebar might collapse)
- [ ] Two-column layouts where appropriate
- [ ] Touch-friendly (buttons spaced well)

**Desktop (large screen):**
- [ ] Content doesn't stretch too wide (max-width)
- [ ] Sidebar is always visible
- [ ] Multi-column layouts utilized
- [ ] Charts are large and detailed

**What to check:**
- [ ] App is usable on all screen sizes
- [ ] No broken layouts
- [ ] All features are accessible (no hidden buttons)

---

#### Test 9.8: Loading States & Feedback
**What you're testing:** Does the app communicate what's happening?

**Check loading indicators:**
- [ ] Shows spinner/skeleton when loading pages
- [ ] Skeleton screens match final content (not just blank)
- [ ] Buttons show loading state when saving ("Saving..." with spinner)
- [ ] Doesn't freeze (stays responsive)

**Check feedback messages:**
- [ ] Success: "Donation added successfully!" (green toast/banner)
- [ ] Error: "Failed to save. Please try again." (red toast/banner)
- [ ] Info: "This drive has no expenses yet." (blue info box)
- [ ] Warning: "Your balance is low." (yellow warning)
- [ ] Messages disappear automatically after few seconds
- [ ] Can dismiss messages manually (X button)

**Check empty states:**
- [ ] When no data: Shows helpful message, not just empty table
- [ ] Example: "No donations yet. Click 'Add Donation' to get started."
- [ ] Includes illustration or icon (makes it less boring)
- [ ] Shows action button relevant to the empty state

---

#### Test 9.9: Accessibility
**What you're testing:** Can everyone use the app?

**Keyboard navigation:**
- [ ] Can tab through all interactive elements
- [ ] Tab order is logical (top to bottom, left to right)
- [ ] Can press Enter to submit forms
- [ ] Can press Escape to close dialogs
- [ ] Focus indicator is visible (outline around focused element)

**Screen reader support:**
- [ ] Images have alt text
- [ ] Buttons have descriptive labels (not just icons)
- [ ] Form fields have associated labels
- [ ] Error messages are announced

**Visual accessibility:**
- [ ] Text is minimum 16px for body copy
- [ ] Links are not only distinguished by color (underline or icon too)
- [ ] Form errors are shown with text, not just red color
- [ ] Color contrast meets WCAG standards (use browser extension to check)

---

#### Test 9.10: Overall User Experience
**What you're testing:** How does it feel to use?

**Ask yourself:**
- [ ] Is it easy to complete tasks without thinking too much?
- [ ] Do things work the way you expect?
- [ ] Are there any confusing moments?
- [ ] Does it feel fast and responsive?
- [ ] Do you trust it with important financial data?
- [ ] Would you be happy to use this every day?
- [ ] Are there any frustrating parts?

**Check for common UX issues:**
- [ ] No dead-end pages (always have a way to go back or forward)
- [ ] Destructive actions (delete) require confirmation
- [ ] Can undo recent actions (if possible)
- [ ] Help text is available for complex features
- [ ] Consistent terminology (don't call it "donation" on one page and "contribution" on another)
- [ ] No unnecessary steps (can do things in fewer clicks?)

---

## ✅ Final Checklist: Is the App Ready?

Go through this final checklist after completing all tests:

### Functionality
- [ ] All core features work correctly
- [ ] Donations can be recorded (bank & cash)
- [ ] Expenses can be tracked
- [ ] Cash management works (transfers, deposits)
- [ ] Bank accounts are managed properly
- [ ] Drives can be created and managed
- [ ] Budgets calculate correctly
- [ ] Reports can be generated and exported
- [ ] Projections help with planning
- [ ] Dashboard shows accurate real-time data

### Data Integrity
- [ ] All balances are always correct
- [ ] No money is lost or created out of nowhere
- [ ] Bank balances match transactions
- [ ] Volunteer cash balances match transactions
- [ ] Budget vs actual calculations are correct
- [ ] Total money in = total money accounted for

### User Experience
- [ ] App is intuitive (can use without manual)
- [ ] Navigation makes sense
- [ ] Forms are easy to fill
- [ ] Lists/tables are easy to read
- [ ] Dashboard is informative at a glance
- [ ] Mobile-friendly
- [ ] Fast loading times (under 3 seconds per page)

### Design
- [ ] Looks professional and clean
- [ ] Colors are consistent and meaningful
- [ ] Text is readable (good contrast, size)
- [ ] Icons and visuals enhance understanding
- [ ] Dark mode works well (if available)
- [ ] No layout issues or broken elements

### Error Handling
- [ ] Invalid inputs are caught and explained
- [ ] Confirmations for important actions
- [ ] Can't delete things that break data
- [ ] Helpful error messages (not technical)
- [ ] No crashes or blank pages

### Real-World Readiness
- [ ] Can handle your actual workflow smoothly
- [ ] Multiple users can work simultaneously
- [ ] Handles month-end and year-end scenarios
- [ ] Supports your reporting needs
- [ ] Forecasting helps with decision making
- [ ] You trust it to be your single source of truth

### Security & Reliability
- [ ] Login/logout works correctly
- [ ] Sessions expire appropriately
- [ ] Can reset password if forgotten
- [ ] Data is saved correctly every time
- [ ] Can handle offline/reconnection gracefully

---

## 📝 Bug Tracking Template

When you find issues, document them like this:

**Bug/Issue #1:**
- **Page:** Donations
- **What I did:** Tried to add donation with empty donor field
- **What happened:** Form submitted anyway, created donation with no donor
- **What should happen:** Should show error: "Please select a donor"
- **Severity:** Medium (causes data quality issues)
- **Screenshot:** [attach if possible]

**Bug/Issue #2:**
- **Page:** Dashboard
- **What I did:** Added expense, then refreshed dashboard
- **What happened:** Balance didn't update, showed old number
- **What should happen:** Should show new balance immediately
- **Severity:** High (incorrect financial data shown)

---

## 🎯 Success Criteria

The app is ready for real-world use when:

1. ✅ **All features work** without major bugs
2. ✅ **Financial calculations are 100% accurate** (no margin for error here!)
3. ✅ **User experience is smooth** (your team can use it without constant questions)
4. ✅ **Design is clear and professional** (builds trust)
5. ✅ **Reports provide the insights you need** for decision-making
6. ✅ **Forecasting helps you plan** drives confidently
7. ✅ **You're confident** it can be your single source of truth

---

## 📊 Testing Progress Tracker

Use this to track your progress:

- [ ] Phase 1: Setup (Users & Volunteers) - 3 tests
- [ ] Phase 2: Financial Foundation (Bank Accounts) - 4 tests
- [ ] Phase 3: Income Flow (Donations) - 10 tests
- [ ] Phase 4: Planning (Drives & Budgets) - 9 tests
- [ ] Phase 5: Execution (Expenses & Cash) - 10 tests
- [ ] Phase 6: Monitoring (Dashboard & Reports) - 7 tests
- [ ] Phase 7: Forecasting (Projections) - 5 tests
- [ ] Phase 8: Edge Cases - 8 tests
- [ ] Phase 9: Design & UX - 10 tests

**Total: 66 comprehensive tests**

---

## 💡 Tips for Effective Testing

1. **Test in order**: Follow the phases sequentially as they build on each other
2. **Take notes**: Document every issue, even small ones
3. **Use real data**: Test with realistic amounts and scenarios
4. **Think like a user**: Forget you know how it should work
5. **Test on different devices**: Phone, tablet, laptop
6. **Test different browsers**: Chrome, Firefox, Safari, Edge
7. **Take breaks**: Fresh eyes catch more issues
8. **Get others to test**: Have someone unfamiliar with the app try it
9. **Test at different times**: Performance might vary
10. **Celebrate progress**: Testing is hard work!

---

Good luck with your testing! This guide should help you thoroughly evaluate if the app is ready to be your organization's single source of truth for financial management.

**Remember:** The goal is not just to find bugs, but to ensure the app truly supports your workflow and helps you manage finances confidently. 🎉
