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