import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ActivityVisibilityOption<T extends string = string> = {
  label: string;
  value: T;
  helper: string;
};

type Props<T extends string = string> = {
  label: string;
  value: T;
  options: ActivityVisibilityOption<T>[];
  onChange: (value: T) => void;
};

export default function ActivityVisibilityDropdown<T extends string = string>({
  label,
  value,
  options,
  onChange,
}: Props<T>) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => options.find((option) => option.value === value) || options[0],
    [options, value]
  );

  const select = (nextValue: T) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <Pressable style={styles.dropdownButton} onPress={() => setOpen((current) => !current)}>
        <View style={styles.dropdownTextWrap}>
          <Text style={styles.dropdownValue}>{selected?.label || 'Select visibility'}</Text>
          <Text style={styles.dropdownHelper}>{selected?.helper || 'Choose who can view this activity.'}</Text>
        </View>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>

      {open ? (
        <View style={styles.menu}>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={option.value}
                style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                onPress={() => select(option.value)}
              >
                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected ? <View style={styles.radioInner} /> : null}
                </View>
                <View style={styles.optionTextWrap}>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionHelper}>{option.helper}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 18,
  },
  label: {
    color: '#10223A',
    fontWeight: '900',
    marginBottom: 8,
  },
  dropdownButton: {
    minHeight: 62,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#C69214',
    backgroundColor: '#FFF6D8',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownTextWrap: {
    flex: 1,
  },
  dropdownValue: {
    color: '#10223A',
    fontSize: 16,
    fontWeight: '900',
  },
  dropdownHelper: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  chevron: {
    color: '#10223A',
    fontSize: 26,
    fontWeight: '900',
    marginLeft: 12,
    lineHeight: 28,
  },
  menu: {
    marginTop: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
  },
  optionRowSelected: {
    backgroundColor: '#FFF9E8',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#98A2B3',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 10,
  },
  radioOuterSelected: {
    borderColor: '#C69214',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#C69214',
  },
  optionTextWrap: {
    flex: 1,
  },
  optionLabel: {
    color: '#10223A',
    fontWeight: '900',
    fontSize: 14,
  },
  optionLabelSelected: {
    color: '#8A650B',
  },
  optionHelper: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
});
