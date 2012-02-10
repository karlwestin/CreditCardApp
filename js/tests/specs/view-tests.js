describe("View tests", function() {

    beforeEach(function() {

      this.templates = Calculator.Templates;
      this.model = new Backbone.Model({
          apr: 2,
          balance: 15000,
          minimum: 2,
          minimum_fixed: 15,
          paybackTime: 377,
          totalAmount: 1445211.21
      });
      this.view = new Calculator.CreditCardView({ 
            model: this.model,
            template: this.templates.view
      });

      this.$el = $(this.view.el);
    });

    describe("Instatiation", function() { 
        it("should create a div", function() {
            expect(this.$el).toHaveClass("creditcard");
        });
    });

    describe("Rendering", function() {
      it("returns the view object", function() {
        expect(this.view.render()).toEqual(this.view);
      });

      it("Renders the model data", function() {
        expect(this.$el).toHaveText(/377/);
        expect(this.$el).toHaveText(/1445211.21/);
        expect(this.$el.find("input[name=balance]")).toHaveValue("15000");
        expect(this.$el.find("input[name=apr]")).toHaveValue("2");
        expect(this.$el.find("input[name=minimum]")).toHaveValue("2");
        expect(this.$el.find("input[name=minimum_fixed]")).toHaveValue("15");        
      });

      it("updates when the model changes", function() {
        this.model.set({ totalAmount: 150000 });
        expect(this.$el).toHaveText(/150000/);
      });

      it("updates the model when the text-fields are submitted", function() {
        this.$el.find("input[name=balance]").val(2000);
        this.view.update();
        expect(this.model.get("balance")).toEqual('2000');
      });

      it("should fire the update method on pressing enter", function() {
        spyOn(this.view, 'update');
        this.view.updateOnEnter({ keyCode: 13 });
        expect(this.view.update).toHaveBeenCalled();
      });

      it("should fire the updateonenter function on keypress", function() {
        spyOn(this.view, 'updateOnEnter');
        // need to re-bind events to be able to spy on them.
        // https://github.com/pivotal/jasmine/issues/141#issuecomment-2437643
        this.view.delegateEvents(); 
        this.$el.find("input").trigger("keypress");
        expect(this.view.updateOnEnter).toHaveBeenCalled();
      });
    
    });
      
    if(Modernizr.inputtypes.range) {
    
    describe("Slider", function() {
    
        it("should add the range element", function() {
            expect(this.$el.find("input[type=range]").length).toBe(1);
        });
        
        it("should have the right value on the slider", function() {
            expect(this.view.slider.val()).toEqual("15");
        });
        
        it("should update slider value on partner input change", function() {
            this.$el.find("input[name=minimum_fixed]").val("60");
            this.$el.find("input[name=minimum_fixed]").trigger("change");
            expect(this.view.slider.val()).toEqual("60");            
        });
        
        it("should update the slider partner input on slider change", function() {
            this.view.slider.val("300");
            this.view.slider.trigger("change");
            expect(this.$el.find("input[name=minimum_fixed]")).toHaveValue("300");        
        });

    });
    
    };    

});
