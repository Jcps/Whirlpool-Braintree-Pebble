
var UI = require('ui');
var Vector2 = require('vector2');
var splashWindow = new UI.Window();
var Vibe = require('ui/vibe');

var whirlpool_token = "REPLACE ME";

var credit_card = "";
var exp_month = "";
var exp_year = "";

var Settings = require('settings');
Settings.config(
  { url: 'http://45.55.170.40/input.html' },
  function(e) {
    console.log('closed configurable');
    console.log(JSON.stringify(e.options));
  }
);

var text = new UI.Text({
  position: new Vector2(0, 0),
  size: new Vector2(144, 168),
  text:'Downloading data...',
  font:'GOTHIC_28_BOLD',
  color:'white',
  textOverflow:'wrap',
  textAlign:'center',
	backgroundColor:'black'
});


// Add to splashWindow and show
splashWindow.add(text);
splashWindow.show();

var parseMachines = function(data){
  var machines = [];
  console.log('raw data: ' + data.contents);
   
  for(var i = 0; i < data.devices.length; i++) {
    var title = data.devices[i].position_description;
    var subtitle;
    var type = data.devices[i].type_code;
    var timeRemaining = data.devices[i].current_cycle.time_remaining.toString();
    var machineID = data.devices[i].machine_id;
    switch(data.devices[i].status) {
      case 0:
        subtitle = "Available";
        break;
      case 1:
        subtitle = "In Use";
        break;
      case 2:
        subtitle = "Out of Order";
        break;
    }
      machines.push({
        title: title,
        subtitle: subtitle,
        type: type,
        timeRemaining: timeRemaining,
        machineID: machineID
      });
  }
  return machines;
};


var ajax = require('ajax');
ajax(
  {
    url: 'https://api-mc360.spindance.com/api/v1/device/status?access_token=' + whirlpool_token + '&location=597',
    type: 'json'
  },
  function(data, status, request) {
    
    var menuItems = parseMachines(data);
    
    // Construct Menu to show to user
    var machinesMenu = new UI.Menu({
      sections: [{
        title: 'Washers and Dryers',
        items: menuItems
      }]
    });

    // Show the Menu, hide the splash
    machinesMenu.show();
    splashWindow.hide();
    
    machinesMenu.on('select', function(e) {
      if(e.item.type == "W"){
        // WASHER
        
        var washerID = e.item.machineID;
        var washerName = e.item.title;
        
        var bodyText;
        var canPurchase;
        if(e.item.timeRemaining === "0"){
          bodyText = "Press select to pay for a cycle. ";
          canPurchase = true;
        } else {
          bodyText = e.item.timeRemaining + " minutes remaining.";
          canPurchase = false;
        }
        
        var washerCard = new UI.Card({
          title: e.item.title,
          subtitle: e.item.subtitle,
          body: bodyText,
          scrollable: true,
        });
        washerCard.show(); 
        
        washerCard.on('click', 'select', function(e){
          if(canPurchase){
          console.log('washerPaymentCard');
          var washerPaymentCard = new UI.Card({
            title: washerName,
            subtitle: '1 cycle: $1',
            body: 'Press the center button to purchase a wash cycle.',
            scrollable: true,
          });
          washerPaymentCard.show();
          washerPaymentCard.on('click', 'select', function(e){
            var machine_id = washerID.substring(0,10);
            console.log('The substringed thing is: ' + machine_id);
            console.log('Trying to send the payment');
            
            var transferMoneyAjax = require('ajax');
            transferMoneyAjax(
              {
                url: 'http://45.55.170.40/doTransaction.php?amount=1.00&cc_num=4111111111111111&expire_m=06&expire_y=19',
                type: 'text'
              },
              function(data, status, request) {
                if(data == "success"){
                  var sendPaymentAjax = require('ajax');
                  sendPaymentAjax(
                    {
                      method: 'post',
                      url: 'https://api-mc360.spindance.com/api/v1/device/payment?access_token=' + whirlpool_token + '&machine_id=' + machine_id + '&user_acct_userid=80210&payment_amount=100',
                      type: 'json'
                    },
                    function(data, status, request){
                      console.log('The payment ajax request worked!');
                      Vibe.vibrate('long');
                      var success = new UI.Card({
                        title: washerName,
                        subtitle: 'Success!',
                        body: 'You were charged $1, pick a setting on the washer!',
                        scrollable: true,
                      }).show();
                      success.on('hide', function() {
                        console.log('Window is hidden!');
                        washerPaymentCard.hide();
                        washerCard.hide();
                      });
                    },
                    function(error, status, request) {
                      console.log('The payment ajax request failed: ' + error);
                    }
                  );
                }
              },
              function(error, status, request) {
                console.log('The ajax for transaction request failed: ' + error);
                console.log('status: ' + status);
              }
            );

           });
          }
        });
        
      } else if(e.item.type == "D"){
        // DRYER
        
        var dryerID = e.item.machineID;
        
        var dryerCard = new UI.Card({
          title: e.item.title,
          subtitle: e.item.subtitle,
          body: e.item.timeRemaining + " min. remaining.",
          scrollable: true,
        });
        dryerCard.show(); 
        
        dryerCard.on('click', 'select', function(e){
          console.log('dryerPaymentCard');
          var dryerPaymentmenu = new UI.Menu({
            sections: [{
              title: "Select a time to add:",
              items: [{
                title: '$1.25',
                subtitle: '5 minutes',
                icon: 'images/5.png',
                cost: 125
              }, {
                title: '$2.50',
                subtitle: '10 minutes',
                icon: 'images/10.png',
                cost: 250
              },{
                title: '$7.50',
                subtitle: '30 minutes',
                icon: 'images/30.png',
                cost: 750
              },{
                title: '$15.00',
                subtitle: '1 hour',
                icon: 'images/60.png',
                cost: 1500
              }]
            }]
          });
          dryerPaymentmenu.show();
          
          dryerPaymentmenu.on('select', function(e){
            var dryerPaymentConfirm =  new UI.Card({
              title: e.item.title + " charge",
              body: "Press select to add " +e.item.subtitle+ " to your dryer time.",
              scrollable: true,
            });
            dryerPaymentConfirm.show();
            
            var cost = e.item.cost;
            var time = e.item.subtitle;
            
            dryerPaymentConfirm.on('click', 'select', function(e){
              var machine_id = dryerID.substring(0,10);
              
               var transferMoneyAjax = require('ajax');
              var cost_dollars = cost/100.0;
              transferMoneyAjax(
              {
                url: 'http://45.55.170.40/doTransaction.php?amount=' + cost_dollars + '&cc_num=4111111111111111&expire_m=06&expire_y=19',
                type: 'text'
              },
              function(data, status, request) {
                if(data == "success"){
              
                console.log('The substringed thing is: ' + machine_id);
                console.log('Trying to send the dryer payment');
                var sendPaymentAjax = require('ajax');
                sendPaymentAjax(
                  {
                    method: 'post',
                    url: 'https://api-mc360.spindance.com/api/v1/device/payment?access_token=' + whirlpool_token + '&machine_id=' + machine_id + '&user_acct_userid=80210&payment_amount=' + cost,
                    type: 'json'
                  },
                  function(data, status, request){
                    console.log('The payment ajax request worked!');
                    Vibe.vibrate('long');
                    var success = new UI.Card({
                        title: washerName,
                        subtitle: 'Success!',
                        body: 'You were charged $' + cost_dollars + ' for ' + time + ' of drying.',
                        scrollable: true,
                      }).show();
                    success.on('hide', function() {
                      console.log('Window is hidden!');
                      dryerPaymentConfirm.hide();
                      dryerPaymentmenu.hide();
                      dryerCard.hide();
                    });
                  },
                  function(error, status, request) {
                    console.log('The payment ajax request failed: ' + error);
                  }
                );
                }
                }
                );
            });
          });
        });
      }
    });
    
  },
  function(error, status, request) {
    console.log('The ajax request failed: ' + error);
  }
);
