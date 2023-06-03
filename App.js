import React, {useMemo, useRef, useState} from 'react';
import {
  View,
  Dimensions,
  Text,
  Pressable,
  ToastAndroid,
  Button,
} from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from 'react-native-gesture-handler';
import {RNHoleView} from 'react-native-hole-view';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

//Global Utils
const {width, height} = Dimensions.get('screen');

const outerCircleRadius = width * 0.9;
const innerCircleRadius = width * 0.55;
const midPt = (outerCircleRadius - innerCircleRadius) / 2;
const centerOfSquare = outerCircleRadius / 2 - 25;
const mulForRad = 180 / Math.PI;

const NPABS = [];
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, -1];
const offsetAngles = [120, -150, -120, -90, -60, -30, 0, 30, 60, 90];
const endAngles = [325, 65, 95, 125, 155, 185, 215, 245, 275, 305];
const correctPassword = 1729;

function App({}) {
  //Utils
  const [numberPosition, setNumbersPosition] = useState([]);
  const [numbersPositionABS, setNumbersPositionABS] = useState([]);
  const [password, setPassword] = useState('');
  const [currentNumber, setCurrentNumber] = useState(-1);
  const [centerPoint, setCenterPoint] = useState({});
  const centerPointRef = useRef();

  //Handlers
  const findTheNearestNumber = event => {
    numbersPositionABS.forEach(elem => {
      if (
        elem.absoluteX + 30 > event.absoluteX &&
        elem.absoluteX - 30 < event.absoluteX &&
        elem.absoluteY + 30 > event.absoluteY &&
        elem.absoluteY - 30 < event.absoluteY
      )
        setCurrentNumber(elem.number);
    });
  };

  const getAngle = event => {
    //Basic Angle Calculation using finding the differences in two coordinate system
    const _x = centerPoint.px - event.absoluteX;
    const _y = centerPoint.py - event.absoluteY;
    let angle = Math.atan(_y / _x) * mulForRad;

    if (currentNumber % 9 === 0 && _x < 0 && _y < 0) {
      //Edge Case for 0 & 9
      angle -= 180;
    } else if (_x < 0) {
      angle += 180;
    }
    if (angle + offsetAngles[currentNumber] < 0) angle += 360; // To Support Complete Rotation

    rotateZAxis.value = angle + offsetAngles[currentNumber];
  };

  const setAngle = angle => {
    rotateZAxis.value = withTiming(angle, {duration: 800});
    setCurrentNumber(-1);
  };

  const setAndCheckPassword = password => {
    if (password === correctPassword.toString()) {
      ToastAndroid.show('Password is Correct 👍', ToastAndroid.SHORT);
      setPassword('');
      return;
    } else if (password.length === 4) {
      ToastAndroid.show('Password is Incorrect ❌', ToastAndroid.BOTTOM);
      setPassword('');
      return;
    }

    setPassword(password);
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
      c.isEnd = false;
      if (currentNumber == -1) runOnJS(findTheNearestNumber)(e);
    },
    onActive: (e, c) => {
      if (currentNumber != -1 && rotateZAxis.value < endAngles[currentNumber]) {
        runOnJS(getAngle)(e);
        if (c.isEnd) c.isEnd = false;
      } else {
        if (!c.isEnd) c.isEnd = true;
      }
    },
    onEnd: (e, c) => {
      runOnJS(setAngle)(0);
      if (currentNumber != -1 && c.isEnd) {
        runOnJS(setAndCheckPassword)(password + currentNumber.toString());
      }
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

    setTimeout(() => {
      centerPointRef.current.measure((fx, fy, width, height, px, py) =>
        setCenterPoint({px: px, py: py}),
      );
    }, 0);

    setNumbersPosition([...temp]);
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
        }}>
        <View style={{marginBottom: 100}}>
          <Text style={{marginBottom: 20}}>Password: {password}</Text>
          <Button
            title="X"
            onPress={() => {
              setPassword(password.slice(0, -1));
            }}
          />
        </View>
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
          <View
            ref={centerPointRef}
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              backgroundColor: 'red',
              zIndex: 1,
            }}
          />
        </View>
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
