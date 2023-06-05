import React, {useLayoutEffect, useMemo, useRef, useState} from 'react';
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
  useSharedValue,
  withTiming,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';

//Global Utils
const {width, height} = Dimensions.get('screen');
const correctPassword = 1729;

//temporary list to store abs positions of numbers
const NPABS = [];

//Numbers in Dialer and their Calculated Angles
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, -1];
const offsetAngles = [120, -150, -120, -90, -60, -30, 0, 30, 60, 90];
const endAngles = [325, 65, 95, 125, 155, 185, 215, 245, 275, 305];

//Animated Pressable Component
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

//Constants for Calculation
const outerCircleRadius = width * 0.9;
const innerCircleRadius = width * 0.55;
const midPt = (outerCircleRadius - innerCircleRadius) / 2;
const centerOfSquare = outerCircleRadius / 2 - 25;
const mulForRad = 180 / Math.PI;
const squareStaringPosition = (-1 * outerCircleRadius) / 2;

function App({}) {
  //Utils
  const [holePosition, setHolePosition] = useState([]);
  const [numbersPositionABS, setNumbersPositionABS] = useState([]);
  const [password, setPassword] = useState('');
  const [currentNumber, setCurrentNumber] = useState(-1);
  const [centerPoint, setCenterPoint] = useState({});
  const [endColor, setEndColor] = useState('red');
  const [isDialer, setIsDialer] = useState(1);
  const [isAnimating, setIsAnimating] = useState(0);
  const centerPointRef = useRef();

  //Calculate Hole Position
  useLayoutEffect(() => {
    let temp = [],
      offsetX = 70,
      offsetY = 30;
    numbers.map((num, index) => {
      //Calculating position in such a way that we can use it for both number and hole position
      if (num === 0) num = 10; // After 9 -> 0(10)
      else if (num === -1) num = 11; //After 0(10) -> -1(11)

      let adj =
        Math.cos(num * (Math.PI / 6)) * ((outerCircleRadius - midPt) / 2);
      let opp =
        Math.sin(num * (Math.PI / 6)) * ((outerCircleRadius - midPt) / 2);

      temp.push({
        //positions of holes
        x: centerOfSquare + adj,
        y: centerOfSquare - opp,
        width: 50,
        height: 50,
        borderRadius: 25,

        //positions for normal Dialer View
        numX: adj,
        numY: opp,

        // positions for simplified View
        y_sim: squareStaringPosition + offsetY,
        x_sim: squareStaringPosition + offsetX,
      });

      if (offsetX === 270) {
        offsetX = -30;
        offsetY += 90;
        if (offsetY === 300) offsetX = 70;
      }
      offsetX += 100;
    });

    //To Calculate Center of the Cirle
    setTimeout(() => {
      centerPointRef.current.measure((fx, fy, width, height, px, py) =>
        setCenterPoint({px: px, py: py}),
      );
    }, 0);

    setHolePosition([...temp]);
  }, []);

  //Handlers
  const findTheNearestNumber = event => {
    numbersPositionABS.forEach(elem => {
      if (
        elem.absoluteX + 30 > event.absoluteX &&
        elem.absoluteX - 30 < event.absoluteX &&
        elem.absoluteY + 30 > event.absoluteY &&
        elem.absoluteY - 30 < event.absoluteY
      ) {
        setCurrentNumber(elem.number);
        if (elem.number === -1) setAndCheckPassword('');
      }
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

  const setAndCheckPassword = number => {
    if (number === '') {
      setPassword(password.slice(0, -1));
      return;
    }

    if (password + number === correctPassword.toString()) {
      setEndColor('green');
    }

    if (password + number.length === 4) {
      setIsAnimating(1); // To Ensure Inconsistency

      //TimeOut to wait for the Animation to Complete
      setTimeout(() => {
        setPassword('');
        setTimeout(() => {
          setEndColor('red');
          setIsAnimating(0);
        }, 200);
      }, 2000);
    }
    setPassword(password + number);
  };

  //Rotate Animated Value, Style and Gesture Handler
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
      if (!isAnimating) {
        c.isEnd = false;
        runOnJS(findTheNearestNumber)(e);
      }
    },
    onActive: (e, c) => {
      if (!isAnimating) {
        if (
          currentNumber != -1 &&
          rotateZAxis.value < endAngles[currentNumber]
        ) {
          runOnJS(getAngle)(e);
          if (c.isEnd) c.isEnd = false;
        } else {
          if (!c.isEnd) c.isEnd = true;
        }
      }
    },
    onEnd: (e, c) => {
      if (!isAnimating) {
        runOnJS(setAngle)(0);
        if (currentNumber !== -1 && c.isEnd) {
          runOnJS(setAndCheckPassword)(currentNumber.toString());
        }
      }
    },
  });

  //Simplifier Animated Value, Style
  const opacity = useSharedValue(1);

  const opacityAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const kindOfOpacityAnimatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        opacity.value,
        [1, 0],
        ['black', 'white'],
      ),
      borderWidth: interpolate(opacity.value, [1, 0], [2, 0]),
      borderRadius: interpolate(opacity.value, [1, 0], [outerCircleRadius, 0]),
    };
  });

  const positionAndScaleAnimatedStyle = useAnimatedStyle(() => {
    return {
      marginBottom: interpolate(opacity.value, [1, 0], [100, 75]),
      transform: [
        {
          scale: interpolate(opacity.value, [1, 0], [1, 1.2]),
        },
      ],
      marginRight: interpolate(opacity.value, [1, 0], [0, width / 3.5]),
    };
  });

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          backgroundColor: 'white',
          paddingHorizontal: 20,
        }}>
        <View style={{marginBottom: 20}}>
          <Text style={{marginBottom: 20, fontWeight: 'bold', fontSize: 40}}>
            {'Enter\nPassword'}
          </Text>
        </View>
        <Animated.View
          style={[
            {
              flexDirection: 'row',
              alignSelf: 'flex-end',
            },
            positionAndScaleAnimatedStyle,
          ]}>
          {[0, 1, 2, 3].map(elem => {
            return (
              <AppPasswordBlock
                key={elem}
                password={password[elem]}
                elem={elem}
                canStartAnimation={password.length === 4}
                endColor={endColor}
              />
            );
          })}
        </Animated.View>
        <Animated.View
          style={[
            {
              width: outerCircleRadius,
              height: outerCircleRadius,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            },
            kindOfOpacityAnimatedStyle,
          ]}>
          {holePosition.length !== 0 &&
            numbers.map((num, index) => {
              return (
                <AppNumber
                  key={num}
                  num={num}
                  x={holePosition[index].numX}
                  y={holePosition[index].numY}
                  x_sim={holePosition[index].x_sim}
                  y_sim={holePosition[index].y_sim}
                  setPositions={setNumbersPositionABS}
                  isDialer={isDialer}
                  setAndCheckPassword={setAndCheckPassword}
                />
              );
            })}

          {isDialer ? (
            <PanGestureHandler onGestureEvent={rotationGestureEvent}>
              <Animated.View
                style={[rotateAnimatedStyle, opacityAnimatedStyle]}>
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
                  holes={holePosition}
                />
              </Animated.View>
            </PanGestureHandler>
          ) : null}

          {isDialer ? (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: innerCircleRadius,
                  height: innerCircleRadius,
                  backgroundColor: 'white',
                  borderWidth: 3,
                  borderRadius: innerCircleRadius / 2,
                },
                opacityAnimatedStyle,
              ]}
            />
          ) : null}

          <View
            ref={centerPointRef}
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              backgroundColor: 'red',
              zIndex: 1,
              opacity: 0,
            }}
          />
        </Animated.View>
        <Text
          onPress={() => {
            if (!isAnimating) {
              setIsAnimating(1);
              let o = opacity.value ^ 1; //Toggleing Two Views

              if (!o) {
                opacity.value = withTiming(o);
              } else {
                setTimeout(() => {
                  opacity.value = withTiming(o); // Wait Time for Animation to Happen
                }, 500);
              }
              setIsDialer(isDialer ^ 1);

              setTimeout(() => {
                setIsAnimating(0);
              }, 750);
            }
          }}
          style={{
            marginTop: 40,
            fontWeight: 'bold',
            fontSize: 24,
            alignSelf: 'flex-end',
          }}>
          SIMPLIFY
        </Text>
      </View>
    </GestureHandlerRootView>
  );
}

function AppNumber({
  num,
  x,
  y,
  setPositions,
  isDialer,
  x_sim,
  y_sim,
  setAndCheckPassword,
  password,
}) {
  //Utils
  const ref = useRef();
  const [size, setSize] = useState({});

  //Animated Value, Style to Reposition Numbers
  const position = useSharedValue(0);

  const positionAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(position.value, [0, 1], [x, x_sim]),
        },
        {
          translateY: interpolate(position.value, [0, 1], [-y, y_sim]),
        },
      ],
    };
  });

  //Calculating Each Number in Dialer's Position
  useMemo(() => {
    setTimeout(() => {
      //Below Approach makes sures that the too many re-renders are happened
      ref.current.measure((fx, fy, width, height, px, py) => {
        //Storing in Temp Global Variable
        NPABS.push({
          number: num,
          absoluteX: px,
          absoluteY: py,
        });

        if (num === -1) setPositions([...NPABS]); //Setting in last rendering
      });
    }, 0);
  }, []);

  // Since when the number in dialer has width it is inaccurately detected in Pan Gesture
  // So, size is only setted at the time of simplification

  //Used timeout to enhance Animation
  useMemo(() => {
    if (!isDialer) {
      setSize({width: 60, height: 60, borderRadius: 30});
      setTimeout(() => {
        position.value = withTiming(1);
      }, 500);
    } else {
      position.value = withTiming(0);
      setTimeout(() => {
        setSize({});
      }, 1000);
    }
  }, [isDialer]);

  return (
    <AnimatedPressable
      ref={ref}
      onPress={() => {
        setAndCheckPassword(num === -1 ? '' : num.toString());
      }}
      style={[{position: 'absolute'}, positionAnimatedStyle]}>
      <Animated.View
        style={[
          {
            backgroundColor: 'black',
            justifyContent: 'center',
            alignItems: 'center',
          },
          size,
        ]}>
        {num > -1 ? (
          <Text
            style={[
              {
                fontSize: 28,
                color: 'white',
                fontWeight: 'bold',
              },
            ]}>
            {num}
          </Text>
        ) : (
          <View
            style={[
              {
                width: 25,
                height: 25,
                backgroundColor: 'white',
                borderRadius: 12.5,
              },
            ]}
          />
        )}
      </Animated.View>
    </AnimatedPressable>
  );
}

function AppPasswordBlock({password, endColor, canStartAnimation, elem}) {
  //Password Animated Value and Style
  const scale = useSharedValue(0);
  const backgroundColor = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: scale.value,
        },
      ],
      backgroundColor: interpolateColor(
        backgroundColor.value,
        [0, 1],
        ['white', endColor],
      ),
    };
  });

  //Memo to run scale animation once even for many rerender until password changes
  useMemo(() => {
    if (password) {
      scale.value = withTiming(1);
    } else if (scale.value) {
      scale.value = withTiming(0);
    }
  }, [password]);

  //Enchanced Animation using Calculated Timeout for 2000ms which is utilized to reset the password at line 162
  useMemo(() => {
    if (canStartAnimation) {
      setTimeout(() => {
        backgroundColor.value = withTiming(1);
        setTimeout(() => {
          scale.value = withTiming(0);
          backgroundColor.value = withTiming(0);
        }, (4 - elem) * 500);
      }, elem * 500);
    }
  }, [canStartAnimation]);

  return (
    <View
      style={{
        width: 25,
        height: 25,
        backgroundColor: 'black',
        borderRadius: 12.5,
        marginLeft: 8,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Animated.View
        style={[
          {
            alignItems: 'center',
            justifyContent: 'center',
            width: 19,
            height: 19,
            borderRadius: 9.5,
          },
          animatedStyle,
        ]}>
        <Text
          style={{
            color: 'white',
          }}>
          {password}
        </Text>
      </Animated.View>
    </View>
  );
}

export default App;
