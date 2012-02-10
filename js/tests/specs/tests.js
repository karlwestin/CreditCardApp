describe("CreditCard model", function() {


    beforeEach(function() {
        
        this.cc = new Calculator.CreditCard({
            balance: 10000,
            apr: 15,
            minimum: 1
        });
    
    });

    describe("when instantiated", function() {
        
        it("should save init attributes", function() {
            expect(this.cc.get("balance")).toEqual(10000);
            expect(this.cc.get("apr")).toEqual(15);
            expect(this.cc.get("minimum")).toEqual(1);
        });
        
    });
    
    describe("fetching data from the server", function() { 
        
        it("should make a call to the server", function() { 
            spyOn($, "getJSON");
            var www = new Calculator.CreditCard();
            expect($.getJSON).toHaveBeenCalledWith("http://karlwestin.com/bank/interest.js", www.setmax);
        });
        
        it("should set a new max_balance based on the return call", function() { 
            this.cc.setmax({"max_balance": 20000});
            expect(this.cc.get("max_balance")).toEqual(20000);
        });
        
    });
    
    describe("Calculating balance", function() {
        beforeEach(function() {
            this.calc = this.cc.calculate(); 
        });
        it("should get the  payment-time for the initial values", function() {
            expect(this.calc.paybackTime).toEqual(335);
        });
        
        it("should get the total amount payed for the initial values", function() {
            expect(this.calc.totalAmount).toEqual(21979.27);
        });
    });

    describe("Calculating balance 2", function() {
        beforeEach(function() {
            this.cc.set({balance:15000, apr: 5.9 }); 
            this.calc = this.cc.calculate(); 
        });
        it("should get the payment-time for the initial values", function() {
            expect(this.calc.paybackTime).toEqual(351);
        });
        
        it("should get the total amount payed for the initial values", function() {
            expect(this.calc.totalAmount).toEqual(22097.99);
        });
    });

    describe("Validation", function() {
        it("should filter out $ and commas from money", function() {
          expect(this.cc.filters["money"]("15,000.02$")).toEqual(15000.02);
        });

        it("should filter out % and commas from percentages", function() {
           expect(this.cc.filters["interest"]("2,3%")).toEqual(2.3);  
        });

        it("should accept semi-weird answer", function() {
            this.cc.set({ balance: "17,00$", apr: "15.4%", minimum: "3.234%" });
            expect(this.cc.get("balance")).toEqual(1700);
            expect(this.cc.get("apr")).toEqual(15.4);
            expect(this.cc.get("minimum")).toEqual(3.23);
        });
        
        it("shouldn't accept one weird answer", function() {
            this.cc.set({apr: "1Û" });
            expect(this.cc.get("apr")).toEqual(15);                
        });

        it("shouldn't accept weird answers", function() {
            this.cc.set({ balance: "aaa", apr: "15,4,65%", minimum: "b%"});
            expect(this.cc.get("balance")).toEqual(10000);
            expect(this.cc.get("apr")).toEqual(15);
            expect(this.cc.get("minimum")).toEqual(1);            
        });
        
        it("should say stop when re-payments are smaller or equal to interest", function() {
            this.cc.set({balance: "300000", apr: "20%", minimum: "0", minimum_fixed: "10"});
            expect(_.isNaN(+this.cc.get("totalAmount"))).toBeTruthy();
        });
        
        it("should say stop when balance is higher than maximum balance", function() {
            this.cc.set({max_balance: "400000"});
            this.cc.set({balance: "500000"});
            expect(this.cc.get("balance")).toEqual(10000);
        });
        
    });

    describe("Reacting to change", function() {
        it("should set paybackTime and totalAmount to 0 when balance is 0", function() {
            this.cc.set({balance: 0});
            expect(this.cc.get("paybackTime")).toEqual(0);
            expect(this.cc.get("totalAmount")).toEqual(0);
        });

        it("should not have paybackTime and totalAmount to 0 when the other fields are correct", function() {
            expect(this.cc.get("paybackTime")).not.toEqual(0);
            expect(this.cc.get("totalAmount")).not.toEqual(0);
        });
    });

});

