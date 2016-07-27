'use strict';

import React, {Component, PropTypes} from 'react';
import {
  StyleSheet,
  View, 
  Text, 
  Image,
  Dimensions,
  PixelRatio,
  PanResponder,
  TouchableWithoutFeedback,
  TouchableOpacity
} from 'react-native';

const upSize = 30;
const downSize = 30;
const middleSize = 40;

class PickerAndroidItem extends Component{

  static propTypes = {
    value: PropTypes.any,
    label: PropTypes.any
  };

  constructor(props, context){
    super(props, context);
  }

  render() {
    return null;
  }

};

export default class PickerAndroid extends Component{

  static Item = PickerAndroidItem;

  static propTypes = {
    //picker's style
    pickerStyle: View.propTypes.style,
    //picker item's style
    itemStyle: Text.propTypes.style,
    //picked value changed then call this function
    onValueChange: PropTypes.func,
    //default to be selected value
    selectedValue: PropTypes.any
  };

  constructor(props, context){
    super(props, context);
    this.state = this._stateFromProps(this.props);
  }

  componentWillReceiveProps(nextProps){
    this.setState(this._stateFromProps(nextProps));
  }

  shouldComponentUpdate(nextProps, nextState, context){
    return JSON.stringify([{
      selectedIndex: nextState.selectedIndex,
      items: nextState.items,
      pickerStyle: nextState.pickerStyle,
      itemStyle: nextState.itemStyle,
      onValueChange: nextState.onValueChange
    }, context]) !== JSON.stringify([{
      selectedIndex: this.state.selectedIndex,
      items: this.state.items,
      pickerStyle: this.state.pickerStyle,
      itemStyle: this.state.itemStyle,
      onValueChange: this.state.onValueChange
    }, this.context]);
  }

  _stateFromProps(props){
    let selectedIndex = 0;
    let items = [];
    let pickerStyle = props.pickerStyle;
    let itemStyle = props.itemStyle;
    let onValueChange = props.onValueChange;
    React.Children.forEach(props.children, (child, index) => {
      child.props.value === props.selectedValue && ( selectedIndex = index );
      items.push({value: child.props.value, label: child.props.label});
    });
    //fix issue#https://github.com/beefe/react-native-picker/issues/51
    this.index = selectedIndex;
    return {
      selectedIndex,
      items,
      pickerStyle,
      itemStyle,
      onValueChange
    };
  }

  _move(dy){
    let index = this.index;
    let length = this.state.items.length;
    this.middleHeight = Math.abs(-index * middleSize + dy);
    let indexTop = index;
    // if(index === 0) {
    //   indexTop = length;
    // }

    this.up && this.up.setNativeProps({
      style: {
        marginTop: (1 - indexTop) * upSize + dy * .75,
      },
    });
    this.middle && this.middle.setNativeProps({
      style: {
        marginTop: -index * middleSize + dy,
      },
    });

    let indexBottom = index;
    // if(index === length - 1) {
    //   indexBottom = -1;
    // }
    this.down && this.down.setNativeProps({
      style: {
        marginTop: (-indexBottom - 1) * downSize + dy * .75,
      },
    });
  }

  _moveTo(index){
    let _index = this.index;
    let diff = _index - index;
    let marginValue;
    let that = this;
    if(diff && !this.isMoving) {
      marginValue = diff * 40;
      this._move(marginValue);
      this.index = index;
      this._onValueChange();
    }
  }
  //cascade mode will reset the wheel position
  moveTo(index){
    this._moveTo(index);
  }

  moveUp(){
    this._moveTo(Math.max(this.state.items.index - 1, 0));
  }

  moveDown() {
    this._moveTo(Math.min(this.index + 1, this.state.items.length - 1));
  }

  _handlePanResponderMove(evt, gestureState){
    let dy = gestureState.dy;
    console.log(dy);
    if(this.isMoving) {
      return;
    }
    // turn down
    if(dy > 0) {
      this._move(dy > this.index * 40 ? this.index * 40 : dy);
    }else{
      this._move(dy < (this.index - this.state.items.length + 1) * 40 ? (this.index - this.state.items.length + 1) * 40 : dy);
    }
  }

  _handlePanResponderRelease(evt, gestureState){
    let middleHeight = this.middleHeight;
    this.index = middleHeight % 40 >= 20 ? Math.ceil(middleHeight / 40) : Math.floor(middleHeight / 40);
    this._move(0);
    this._onValueChange();
  }

  componentWillMount(){
    this._panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderRelease: this._handlePanResponderRelease.bind(this),
      onPanResponderMove: this._handlePanResponderMove.bind(this)
    });
    this.isMoving = false;
    this.index = this.state.selectedIndex;
  }

  componentWillUnmount(){
    this.timer && clearInterval(this.timer);
  }

  _renderItems(items){
    //value was used to watch the change of picker
    //label was used to display 
    let upItems = [], middleItems = [], downItems = [];
    items.forEach((item, index) => {

      upItems[index] =
            <View
                style={{width: width, height: upSize, justifyContent: 'center', alignItems: 'center'}}
                >
                <TouchableOpacity
                  onPress={() => {
                  this._moveTo(index);
                }} >
              <Text
                key={'up'+index}
                style={[styles.upText, this.state.itemStyle]}
                >
                {item.label}
              </Text>
              </TouchableOpacity>
            </View>

      middleItems[index] =
              <TouchableOpacity
                style={{width: width, height: middleSize, justifyContent: 'center', alignItems: 'center'}}
                
                  onPress={() => {
                  this._moveTo(index);
                }} >
                <Text
                  key={'mid'+index}
                  style={[styles.middleText]}
                  
                  >{item.label}

                </Text>
              
              </TouchableOpacity>

      downItems[index] = 
              <View
                style={{width: width, height: upSize, justifyContent: 'center', alignItems: 'center'}}
                >
                <TouchableOpacity
                  onPress={() => {
                  this._moveTo(index);
                }} >
                <Text
                  key={'down'+index}
                  style={[styles.upText, this.state.itemStyle]}
                   >
                  {item.label}
                </Text>
                </TouchableOpacity>
              </View>

    });

    return { upItems, middleItems, downItems, };
  }

  _onValueChange(){
    //the current picked label was more expected to be passed, 
    //but PickerIOS only passed value, so we set label to be the second argument
    //add by zooble @2015-12-10
    var curItem = this.state.items[this.index];
    this.state.onValueChange && this.state.onValueChange(curItem.value, curItem.label);
  }

  render(){
    let index = this.state.selectedIndex;
    let length = this.state.items.length;
    let items = this._renderItems(this.state.items);

    let indexTop = index;
    // if(index === 0) {
    //   indexTop = length;
    // }

    let upViewStyle = {
      marginTop: (1 - indexTop) * upSize, 
      height: length * upSize, 
    };
    let middleViewStyle = {
    };

    let indexBottom = index;
    // if(index === length - 1) {
    //   indexBottom = -1;
    // }

    let downViewStyle = {
      marginTop: (-indexBottom - 1) * downSize, 
      height:  length * downSize, 
    };
    

    return (
      //total to be 90*2+40=220 height
      <View style={[styles.container, this.state.pickerStyle]} {...this._panResponder.panHandlers}>

        <View style={styles.up}>
          <View style={[styles.upView, upViewStyle]} ref={(up) => { this.up = up }} >
            { items.upItems }
          </View>
        </View>

        <View style={styles.middle}>
          <View style={[styles.middleView, middleViewStyle]} ref={(middle) => { this.middle = middle }} >
            { items.middleItems }
          </View>
        </View>

        <View style={styles.down}>
          <View style={[styles.downView, downViewStyle]} ref={(down) => { this.down = down }} >
            { items.downItems }
          </View>
        </View>

      </View>
    );
  }

};

let width = Dimensions.get('window').width;
let height = Dimensions.get('window').height;
let ratio = PixelRatio.get();
let styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    //this is very important
    backgroundColor: null
  },
  up: {
    height: upSize,
    overflow: 'hidden'
  },
  upView: {
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  upText: {

    fontSize: 17,
    color: '#000',
    opacity: .5,

  },
  middle: {
    height: middleSize,
    width: width,
    overflow: 'hidden',
  
  },
  middleView: {
    height: middleSize,
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  middleText: {

    color: '#000',
    fontSize: 22,

  },
  down: {
    height: downSize,
    overflow: 'hidden'
  },
  downView: {
    overflow: 'hidden',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  downText: {
    paddingTop: 0,
    height: downSize,
    fontSize: 16,
    color: '#000',
    opacity: .5,
    paddingBottom: 0,
    marginTop: 0,
    marginBottom: 0
  }

});
