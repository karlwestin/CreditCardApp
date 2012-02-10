var Calculator = {
    Templates: {
        view: '<form class="well max form-horizontal"> \
        <% _.each(errors, function(error) { %> <div class="well error"><%= error %></div> <% }) %> \
        <div class="max control-group"><label class="control-label" for="balance">Debt ($)</label><div class="controls"><input type="text" id="balance" name="balance" value="<%= balance %>"></div></div> \
        <div class="max control-group"><label class="control-label" for="apr">Interest apr (%)</label><div class="controls"><input type="text" id="apr"  name="apr" value="<%= apr %>"></div></div> \
        <div class="max control-group"><label class="control-label" for="minimum">Minimum payment (%)</label><div class="controls"><input type="text" id="minimum" name="minimum" value="<%= minimum %>"></div></div> \
        <div class="max control-group"><label class="control-label" for="minimum_fixed">Minimum fixed payment ($)</label><div class="controls"><input type="text" id="minimum_fixed" name="minimum_fixed" value="<%= minimum_fixed %>"></div></div> \
        <div class="max tcenter control-group"><input type="button" class="btn btn-large btn-primary" value="Calculate"></div> \
        \
            <div class="output well green"><h6>Payback time (months):</h6><h3><%= paybackTime %></h3></div> \
            <div class="output well green"><h6>Total amount paid ($):</h6><h3><%= totalAmount %></h3></div> \
        \
        </form> \
        ',
    },

     CreditCard: Backbone.Model.extend({
    
        defaults: {
            balance: "",
            apr: "", 
            minimum: "",
            minimum_fixed: 15,
            max_balance: 500000,
            paybackTime: 0,
            totalAmount: 0,
        },
        
        initialize: function() {
            _.bindAll(this, "setmax");
            $.getJSON("http://karlwestin.com/bank/interest.js", this.setmax );
        },
        
        setmax: function(max) {
            this.set({max_balance: max.max_balance});
        },
        
      /*
       * Validation:
       * The validation machinery consists of the native backbone "validate"-method,
       * a hash with validation rules and messages and a hash with filter functions.
       * Finally i re-use the filter-functions to give some auto-corrections 
       * to speed things up for the user, by over-riding the native backbone "set"-method.
       */
    
        validate: function(attrs) {
            
            var errors = [];
            
            _.each(attrs, function(val, key) { 
                if(!!this.validations[key]) {
                  if (_.isNaN(val)) // filter methods have already been applied in "set" function
                    errors.push( this.validations[key].message );
                }
            }, this);
            
            if(!!attrs["balance"] && attrs["balance"] > this.get("max_balance"))
                errors.push("The maximum allowed balance is: " + this.get("max_balance"));
            
            if(!!errors.length) return errors;
        
        },
    
        validations: {
          max_balance:    { filter: "money",    message: "Not submitted by the user" },    
          balance:        { filter: "money",    message: "Please fill the balance in like in this example: 15000.00" },
          apr:            { filter: "interest", message: "Please fill the interest rate in on the form: 14.9%" },
          minimum:        { filter: "interest", message: "Please fill the minimum payment in percentage, for example 2%" },
          minimum_fixed:  { filter: "money",    message: "Please fill in the fixed minimum amount as dollars, 15.00$" },
        },
    
        filters: {
            
            money: function(val) {
                return roundToTwo( +val.toString().replace(/[\$,]/g, "")); 
            },
                
            interest: function(val) {
                return roundToTwo( +val.toString().replace(/[%]/g, "").replace(/,/, "."));
            },        
    
        },
    
        set: function(attrs, options) {
          var error = false;
          _.each(attrs, function(val, key) { 
             if(!!this.validations[key]) {
               attrs[key] = this.filters[ this.validations[key].filter ](val);
               if(_.isNaN(attrs[key])) error = true;
               }
          }, this);
          
          if(!!attrs["balance"] && attrs["balance"] > this.get("max_balance"))
            error = true;
    
          if(!error)
              _.extend(attrs, this.calculate(attrs));
          
          Backbone.Model.prototype.set.call(this, attrs, options);
          return this;
        },
    
        /*
         *  Calculate:
         *  @returns { 
         *    paybackTime (number) - Payback-time in months
         *    totalAmount (number) – Total amount payed
         *  }
         *  
         *  Currently you pay either:  
         *  • X % of the balance + the monthly interest rate or
         *  • A fixed amount            
         *  
         *  To change to change to a "pure" percentage-based minimum payment,
         *  i.e. always paying 2%, change the loop to:
         *
         *  if(principal > min)
         *     principal = Math.min(min, balance);
         *
         *  balance -= principal - interest;
         *  payments.push(principal);
         *
         */
    
        calculate: function(config) {
    
            config || (config = {});
    
            _.forEach(["apr", "balance", "minimum", "minimum_fixed"], function(key) {
                if (_.isUndefined(config[key])) config[key] = this.get(key);
            }, this);
    
            var balance = config.balance,
                payments = [],
                payment_percentage = config.minimum/100,
                mRate = config.apr/1200,
                min = config.minimum_fixed;
    
            if( (payment_percentage === 0) && (min <= mRate * balance) )
                return { totalAmount: "No re-payment is being made", paybackTime: "-" };
    
            for(;balance>0;) {
              var principal = roundToTwo(payment_percentage * balance),
                  interest = roundToTwo(mRate * balance);
    
              if(principal + interest < min)
                  principal = Math.min((min - interest), balance);
    
              balance -= principal;
              payments.push(principal + interest);
            }
    
            return { paybackTime: payments.length, totalAmount: roundToTwo(_.reduce(payments, function(sum, val) { return sum += val; }, 0)) };  
        },
    
    }),

    CreditCardView: Backbone.View.extend({

        initialize: function(options) {
          _.bindAll(this, 'render', 'update', 'errorHandler');
          this.model.bind('error', this.errorHandler);
          this.model.bind('change', this.render);
          this.template = _.template(options.template || "");
          this.render();
          window.that = this;
        },
    
        className: "row-fluid creditcard",
    
        events: {
          "keypress input[type=text]": "updateOnEnter",
          "click input[type=button]": "update",
        },
        
        errorHandler: function(model, errors) {
            this.render(errors);
        },
    
        render: function(errors) {
          if(errors && !errors.length)
              errors = [];
          var data = _.extend(this.model.toJSON(), { errors: errors });
          $(this.el).html(this.template(data));
          this.slider = this.addSlider(this.$("input[name=minimum_fixed]"));
          return this;
        },
    
        update: function() {
          var balance       = this.$('input[name=balance]').val(),
              minimum       = this.$('input[name=minimum]').val(),
              minimum_fixed = this.$('input[name=minimum_fixed]').val(),              
              apr           = this.$('input[name=apr]').val();
          this.model.set({ balance: balance, minimum: minimum, apr: apr, minimum_fixed: minimum_fixed });
        },
    
        updateOnEnter: function(e) {
          if(e.keyCode == 13) this.update();
        },
        
        addSlider: function(partner) {
            if(partner.length > 0 && Modernizr.inputtypes.range) {
                var slider = $("<input type='range' min='10' max='1000'>"),
                    view = this;
                
                partner.parent().append(slider);

                slider.change(function(e) {
                    partner.val( slider.val() );
                });
                
                slider.mouseup(function(e) {
                    view.update();
                });
                
                partner.change(function(e) {
                    slider.val(partner.val());
                });

                slider.val(partner.val());

                return slider;
            }
        },
    
    }),
    
};



/*
 * roundTwoTwo()
 *  @string
 *  @returns string with number rounded to two decimals
 */
function roundToTwo(num) {
  return +num.toFixed(2);
}
