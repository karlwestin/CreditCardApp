Credit-Card Calculator
====

Simple credit-card repayment calculator, written as a backbone.js application, with unit-tests.

To run tests, point the browser to: [baseurl]/js/tests/

The calculating function:
-----

The current calculation algorithm is based on 
a) minimum payment percentage + monthly interest rate or 
b) a minimum fixed payment, 

depending on what's larger.

User interface:
-----

I tried to implement a couple of nice things, like for example allowing the user to user % and $ in the input fields, and filter the characters out instead of showing error messages for those characters that actually belong there, sort of :)  
I also put the slider on the fixed amount minimum-payment, cause i thought that'd be the one the user want's to play around a little with


How i would proceed from here:
------

* Most important: making the slider update the values "live" (now it updates on release) and rendering errors without clearing fields, for that I would need to split the template up in three parts. 

* Find a better way of updating paybackTime and totalAmount on change in the model, while still being able to filter out some chars from the input fields (which i think is important and helpful for the user)

* Put the html-templates in an external file, currently it's horror to edit it.