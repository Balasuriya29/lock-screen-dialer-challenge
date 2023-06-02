import React, {useMemo, useRef, useState} from 'react';
import {View, Dimensions, Text, Pressable} from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from 'react-native-gesture-handler';
import {RNHoleView} from 'react-native-hole-view';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const {width, height} = Dimensions.get('screen');

const outerCircleRadius = width * 0.9;
const innerCircleRadius = width * 0.55;
const midPt = (outerCircleRadius - innerCircleRadius) / 2;
const centerOfSquare = outerCircleRadius / 2 - 25;
const mulForRad = 180 / Math.PI;
const twoPI = 2 * Math.PI;
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, -1];
const stopPosition = [1, 2, 3, 20, 50, 80, 110, 140, 170, 0, -1];
let startAngle = 0;
let isStart = 1;

const NPABS = [];

function App({}) {
  //Utils

  const [numberPosition, setNumbersPosition] = useState([]);
  const [numbersPositionABS, setNumbersPositionABS] = useState([]);
  const [offsetAngle, setOffsetAngle] = useState(0);
  const [password, setPassword] = useState('');
  const [currentNumber, setCurrentNumber] = useState(-1);

  //Handlers
  const findTheNearestNumber = event => {
    numbersPositionABS.forEach(elem => {
      if (
        elem.absoluteX + 30 > event.absoluteX &&
        elem.absoluteX - 30 < event.absoluteX &&
        elem.absoluteY + 30 > event.absoluteY &&
        elem.absoluteY - 30 < event.absoluteY
      ) {
        // console.log(elem.number);
        setPassword(password + elem.number.toString());
        setOffsetAngle((9 - elem.number) * 30);
        setCurrentNumber(elem.number);
      }
    });
  };

  const getAngle = ({event, context}) => {
    let xDiff = event.absoluteX - context[0];
    let yDiff = event.absoluteY - context[1];
    let angle = Math.atan(yDiff / xDiff) * mulForRad;
    console.log(currentNumber);
    // console.log('xDiff : ---> ' + xDiff);
    // console.log('yDiff : ---> ' + yDiff);

    // if (isStart) {
    //   startAngle = angle;
    //   angle = isStart = 0;
    // } else {
    //   console.log('Start: ---> ' + startAngle);
    //   console.log('Previous : ---> ' + angle);
    //   angle -= startAngle;
    // }

    if (angle < 0) angle += 180;

    console.log('Next : ---> ' + angle);
    rotateZAxis.value = angle;
  };

  const setAngle = angle => {
    rotateZAxis.value = withTiming(angle);
    isStart = 1;
    startAngle = 0;
    console.log('======================================================');
    setCurrentNumber(-1);
  };

  //Rotate Animated Values
  const rotateZAxis = useSharedValue(0);

  const rotateAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotateZ: rotateZAxis.value + 'deg',
        },
      ],
    };
  });

  const rotationGestureEvent = useAnimatedGestureHandler({
    onStart: (e, c) => {
      c.startX = e.absoluteX;
      c.startY = e.absoluteY;

      if (currentNumber == -1) runOnJS(findTheNearestNumber)(e);
    },
    onActive: (e, c) => {
      if (
        rotateZAxis.value >= 0 &&
        rotateZAxis.value < 170 &&
        currentNumber != -1
      )
        runOnJS(getAngle)({event: e, context: [c.startX, c.startY]});
    },
    onEnd: (e, c) => {
      runOnJS(setAngle)(0);
    },
  });

  //Calculate Hole Position
  useMemo(() => {
    let temp = [];
    numbers.map((num, index) => {
      let adj =
        Math.cos((index + 1) * (Math.PI / 6)) *
        ((outerCircleRadius - midPt) / 2);
      let opp =
        Math.sin((index + 1) * (Math.PI / 6)) *
        ((outerCircleRadius - midPt) / 2);

      temp.push({
        x: centerOfSquare + adj,
        y: centerOfSquare - opp,
        width: 50,
        height: 50,
        borderRadius: 25,
      });
    });

    setNumbersPosition([...temp]);
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'white',
        }}>
        <View
          style={[
            {
              backgroundColor: 'black',
              width: outerCircleRadius,
              height: outerCircleRadius,
              borderRadius: outerCircleRadius,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              borderWidth: 2,
            },
          ]}>
          {numbers.map((num, index) => {
            let adj =
              Math.cos((index + 1) * (Math.PI / 6)) *
              ((outerCircleRadius - midPt) / 2);
            let opp =
              Math.sin((index + 1) * (Math.PI / 6)) *
              ((outerCircleRadius - midPt) / 2);

            return (
              <AppNumber
                key={num}
                num={num}
                x={adj}
                y={opp}
                setPositions={setNumbersPositionABS}
              />
            );
          })}

          <PanGestureHandler onGestureEvent={rotationGestureEvent}>
            <Animated.View style={[rotateAnimatedStyle]}>
              <RNHoleView
                style={[
                  {
                    width: outerCircleRadius,
                    height: outerCircleRadius,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'white',
                    borderRadius: outerCircleRadius / 2,
                    borderWidth: 2,
                  },
                ]}
                holes={numberPosition}></RNHoleView>
            </Animated.View>
          </PanGestureHandler>
          <View
            style={{
              position: 'absolute',
              width: innerCircleRadius,
              height: innerCircleRadius,
              backgroundColor: 'white',
              borderWidth: 3,
              borderRadius: innerCircleRadius / 2,
            }}
          />
        </View>

        <Text style={{marginTop: 100}}>Password</Text>
        <Text>{password}</Text>
      </View>
    </GestureHandlerRootView>
  );
}

function AppNumber({num, x, y, setPositions}) {
  const ref = useRef();

  useMemo(() => {
    setTimeout(() => {
      ref.current.measure((fx, fy, width, height, px, py) => {
        NPABS.push({
          number: num,
          absoluteX: px,
          absoluteY: py,
        });

        if (num === 0) setPositions([...NPABS]);
      });
    }, 0);
  }, []);

  return (
    <Pressable
      ref={ref}
      onPress={() => {
        console.log(num);
      }}
      style={[
        {position: 'absolute'},
        {
          transform: [
            {
              translateX: x,
            },
            {translateY: -y},
          ],
        },
      ]}>
      {num > -1 ? (
        <Text
          style={[
            {
              fontSize: 30,
              color: 'white',
              fontWeight: 'bold',
            },
          ]}>
          {num}
        </Text>
      ) : (
        <View
          style={{
            width: 25,
            height: 25,
            backgroundColor: 'white',
            borderRadius: 12.5,
          }}
        />
      )}
    </Pressable>
  );
}

export default App;
