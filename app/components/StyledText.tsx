import React from 'react';
import { Text as RNText, TextInput as RNTextInput, TextProps, TextInputProps } from 'react-native';

export function Text(props: TextProps) {
  return <RNText {...props} allowFontScaling={false} />;
}

export function TextInput(props: TextInputProps) {
  return <RNTextInput {...props} allowFontScaling={false} />;
}
