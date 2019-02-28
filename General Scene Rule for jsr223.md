

This is a general scene rule that for javascript for jsr223 for use in the [openHAB](https://www.openhab.org/) (version 1) system. It has been working quite well and is stable, so I figured I would share it. Before writing this, I couldn't find any way to easily write a "scene" that could set various different items to arbitrary (read: not all the same) values. I ended up coding specific rules for each scene, and it was very tedious. I also wanted the possibility of storing an item's level for a scene in a virtual item, or to define it with a specific value that never changes. This rule allows both of those things.  

Here's the code, and then I'll explain a little bit underneath.

```

var scenes = [
  {
    stateItem: "Scene_Living",
    states: [
      {
        stateValue: "0", // OFF
        targetValues: [
          { item: "kitchenLights", value: "OFF" },
          { item: "nookLight", value: "OFF" },
          { item: "livingRoomLamp", value: "OFF" },
          { item: "livingRoomTableLamp", value: "OFF" },
          { item: "livingRoomCeilingLights", value: "OFF" }
        ] 
      },
      {
        stateValue: "1", // DIM
        targetValues: [
          { item: "kitchenLights", value: "setting_lr_dim_kitchenBrightness" },
          { item: "nookLight", value: "setting_lr_dim_nookBrightness" },
          { item: "livingRoomLamp", value: "setting_lr_dim_sofaLampBrightness" },
          { item: "livingRoomTableLamp", value: "setting_lr_dim_tableLampBrightness" },
          { item: "livingRoomCeilingLights", value: "setting_lr_dim_ceilingLightBrightness" }
        ] 
      },
      {
        stateValue: "2", // HALF
        targetValues: [
          { item: "kitchenLights", value: "setting_lr_med_kitchenBrightness" },
          { item: "nookLight", value: "setting_lr_med_nookBrightness" },
          { item: "livingRoomLamp", value: "setting_lr_med_sofaLampBrightness" },
          { item: "livingRoomTableLamp", value: "setting_lr_med_tableLampBrightness" },
          { item: "livingRoomCeilingLights", value: "setting_lr_med_ceilingLightBrightness" }
        ] 
      },
      {
        stateValue: "3", // FULL
        targetValues: [
          //{ item: "kitchenLights", value: "ON" },
          { item: "kitchenLights", value: "ON" },
          { item: "nookLight", value: "ON" },
          { item: "livingRoomLamp", value: "ON" },
          { item: "livingRoomTableLamp", value: "ON" },
          { item: "livingRoomCeilingLights", value: "ON" }
        ] 
      }
    ],
    nonMatchValue: "4"
  }
];






var generalSceneRule = new Rule(){
    getEventTrigger: function(){
    var triggers = [];
    var updateItems = [];
  
    for(var i = 0; i < scenes.length; i++){
      var currentScene = scenes[i];
      oh.logInfo("generalSceneRule", "Adding CommandEventTrigger [{}]", scenes[i].stateItem);
      triggers.push(new CommandEventTrigger(scenes[i].stateItem, null));
      
      for(var j = 0; j < currentScene.states.length; j++){
        var currentState = currentScene.states[j];
        
        for(var k = 0; k < currentState.targetValues.length; k++) {
          var currentTargetValue = currentState.targetValues[k];
          
          // add this targetValue to updateItems array if it's not there
          var alreadyAdded = false;
          for(var m = 0; m < updateItems.length; m++){
            if(updateItems[m] == currentTargetValue.item){
              alreadyAdded = true;
              break;
            }
          }
          if(!alreadyAdded){
            //oh.logInfo("generalSceneRule", "Adding item [{}] to updateItems", currentTargetValue.item);
            updateItems.push(currentTargetValue.item);
          }
        }
      }
    }
    
    for(var i = 0; i < updateItems.length; i++){
      triggers.push(new ChangedEventTrigger(updateItems[i]));
    }
    
    return triggers;
  },
  execute: function(event){
    oh.logInfo("generalSceneRule", "event=[{}]", event);
    var triggerItem = event.getItem().getName();
    
    // Scene was triggered
    if(event.triggerType == "COMMAND"){
      var command = event.getCommand();
      oh.logInfo("generalSceneRule", "command=[{}]", command);
    
      // Get the correct Scene
      for(var i = 0; i < scenes.length; i++){
        var currentScene = scenes[i];
        if(currentScene.stateItem == triggerItem){
          // trigger the states
          for(var j = 0; j < currentScene.states.length; j++){
            var currentState = currentScene.states[j];
            
            oh.logInfo("generalSceneRule", "stateValue=[{}]", currentState.stateValue);
            if(currentState.stateValue == command){
              oh.logInfo("generalSceneRule", "got a matching stateValue");
              
              for(var k = 0; k < currentState.targetValues.length; k++){
                var currentTargetValue = currentState.targetValues[k];
                
                var commandToSend = currentTargetValue.value;
                oh.logInfo("generalSceneRule", "Sending command. currentTargetValue.value=[{}]", currentTargetValue.value);
                // if target value is an item, get its state
                
                try{
                  var item = ir.getItem(currentTargetValue.value);
                  oh.logInfo("generalSceneRule", "Got an item");
                  commandToSend = item.state.toString();
                }
                catch(e)
                {
                  oh.logInfo("generalSceneRule", "No item exists with name [{}], treating as command.", currentTargetValue.value);
                }
                
                oh.logInfo("generalSceneRule", "Sending command. Item=[{}], Command=[{}]", currentTargetValue.item, commandToSend);
                be.sendCommand(currentTargetValue.item, commandToSend);
              }
            }
          }
          
          break;
        } 
      }
      
      }
    else if(event.triggerType == "CHANGE"){
      oh.logInfo("generalSceneRule", "Got CHANGE event. event.getItem().getName()=[{}]", event.getItem().getName())
      
        for(var i = 0; i < scenes.length; i++){
          var currentScene = scenes[i];
          //oh.logInfo("generalSceneRule", "stateItem=[{}]", currentScene.stateItem);
          
          var foundStateMatch = false;
          for(var j = 0; j < currentScene.states.length; j++){
            var currentState = currentScene.states[j];
            //oh.logInfo("generalSceneRule", "    stateValue=[{}]", currentState.stateValue);
            
            
            var possibleMatch = false;
            for(var k = 0; k < currentState.targetValues.length; k++){
              var currentTargetValue = currentState.targetValues[k];
              //oh.logInfo("generalSceneRule", "        item=[{}]", currentTargetValue.item);
              
              if(event.getItem().getName() == currentTargetValue.item){
                //oh.logInfo("generalSceneRule", "        Possible state match stateItem=[{}], stateValue=[{}], item=[{}]", currentScene.stateItem, currentState.stateValue, currentTargetValue.item);
                
                possibleMatch = true;
                break;
              }
            }
            
            if(possibleMatch){
              //oh.logInfo("generalSceneRule", "            Possible state match, looping through items in stateItem=[{}], stateValue=[{}]", currentScene.stateItem, currentState.stateValue);
              var currentStateIsMatch = true;
              for(var k = 0; k < currentState.targetValues.length; k++){
                var currentTargetValue = currentState.targetValues[k];
                var itemTargetValue = "";
                try{
                  var item = ir.getItem(currentTargetValue.value);
                  itemTargetValue = item.state;
                }
                catch(e)
                {
                  //oh.logInfo("generalSceneRule", "            No item exists with name [{}], treating as command.", currentTargetValue.value);
                  itemTargetValue = currentTargetValue.value;
                }
                
                var itemState = ir.getItem(currentTargetValue.item).state.toString();
                
                
                //oh.logInfo("generalSceneRule", "            item=[{}], item.state=[{}], itemTargetValue=[{}]", currentTargetValue.item, itemState, itemTargetValue);
                
                if(itemState == itemTargetValue || 
                (itemState == "0" && itemTargetValue.toString().toUpperCase() == "OFF") ||
                (itemState == "100" && itemTargetValue.toString().toUpperCase() == "ON")) 
                {
                  //oh.logInfo("generalSceneRule", "            This item was a match with [{}], continuing.", itemState);
                }
                else { 
                  //oh.logInfo("generalSceneRule", "            This item was a not a match. Breaking.");
                  currentStateIsMatch = false;
                  break;
                }
              }
              
              if(currentStateIsMatch){
                oh.logInfo("generalSceneRule", "            After all items, this state is a match. Setting item [{}] to value [{}].", currentScene.stateItem, currentState.stateValue);
                foundStateMatch = true;
                be.postUpdate(currentScene.stateItem, currentState.stateValue);
              }
              else{
                //oh.logInfo("generalSceneRule", "            After all items, this state is not a match. item [{}] value [{}].", currentScene.stateItem, currentState.stateValue);
              }
            }
            else{
              //oh.logInfo("generalSceneRule", "            Not a match. stateItem=[{}], stateValue=[{}]", currentScene.stateItem, currentState.stateValue);
            }
            
          }
          
          // Didn't find a state match, set scene value to nonMatchValue if there is one
          if(!foundStateMatch){
            oh.logInfo("generalSceneRule", "No scene matches. currentScene.nonMatchValue=[{}]", currentScene.nonMatchValue);
            if(currentScene.nonMatchValue) {
              oh.logInfo("generalSceneRule", "Updating scene to item=[{}], value=[{}]", currentScene.stateItem, currentScene.nonMatchValue);
              be.postUpdate(currentScene.stateItem, currentScene.nonMatchValue);
            }
          }
        }
    }
    
  }
};





function getRules(){return new RuleSet(
  [
    generalSceneRule
  ]);
}     
```

**Scene Configuration Array**

The "scenes" variable in this code is an array of objects. Each object has:

* A "stateItem" property which is the name of the openHAB item which stores the scene state. This would be the item you send a command to to change the scene. 
* A "states" property which is an array of objects. Each object in this array is one of the states that a scene could be in. 
* A "nonMatchValue" property, which is the value the rule will set the "stateItem" to if the states of the items in the scene do not match any of the specified "states"

**State Configuration Items**


Each item in the "states" array has the following properties:

* A "stateValue" property. If the "stateItem" gets modified and receives the command for the value set in the "stateValue" property for a scene, all items in that scene will get set to the value specified in the "targetValues" array.
* A "targetValues" property, which is an array of item settings for the scene. Each item object in this array contains an "item" property which specifies the name of the openHAB item, and a "value" property which specifies the value to set the "item" to. The "value" can contain either a specific command like "OFF" or the name of an openHAB item which contains the state like "setting_lr_dim_kitchenBrightness". The rule is smart enough to determine which option is specified and act accordingly. You can add an arbitrary number of items into each "targetValues" array.

**Rule Triggers**

The rule works like this: when the rule file is loaded, the "getEventTrigger" function loops through all of the items in the "scenes" array, and adds a trigger for each "stateItem" and each of the items specified in any of the "targetValues". After it completes, the rule will run when there is a change to any item which is part of a scene in the "scenes" array.

**Changes to a Scene's "stateItem"**

When the rule is triggered by a command to a scene's "stateItem" it locates the rule in the "scenes" array that has that item as the "stateItem", and then fines the state in the "states" array whose "stateValue" matches the command given. If it finds one, it sets all of the items in that state's "targetValues" array to the value specified in the "value" option for that "item". If "value" is an openHAB item name, it sends the state of that item as a command. Otherwise it sends the "value" string as a command.

**Changes to an Item in a State's "targetValues" Array**

When the rule is triggered by a change to any of the items in a scene, the rule loops through all of the "states" within all of the scenes to find any scenes that incorporate the changed item. If it finds any, it checks each of them against the current state of items. If all of the items in the "targetValues" array of a scene state match the current values of the actual items, then it updates the "stateItem" for that scene to the "stateValue" of the matching item in the "states" array. If none of the items in the "states" array match every "item", then the "nonMatchValue" (if it exists) will be applied to the "stateItem".

For an example of the previous paragraph, imagine I had set "Scene_Living" to "3" and all of the lights are 100% on according to that state in the scenes array. If I change "kitchenLights" to "OFF", it will look through the "states" array, and not find any state with "kitchenLights" "OFF" and every other item "ON". So the "Scene_Living" item gets updated to the "nonMatchValue" of "4", which I have mapped to display the string "Custom" in the sitemap. If I then proceed to set all items to "OFF", when the last item is changed, the rule will see that the first state object matches all of the items by having "OFF" values. It will set the "Scene_Living" item to the state's "stateValue", which is "0". The sitemap will show "Scene_Living" with the value "0", which I have mapped to the display string "Off". 

I hope this is helpful! It's been very nice and stable for me!