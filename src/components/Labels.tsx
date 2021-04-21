import React, { FC } from 'react'
import { Label } from '../types';
import { getColorByBrightness } from "../utils/helpers";
import "./Labels.scss";

interface LabelProps {
  labels: Label[]
}

const Labels: FC<LabelProps> = ({ labels }) => {
  function getStyles(label: Label) {
    return {
      backgroundColor: `#${label.color}`,
      color: getColorByBrightness(label.color)
    }
  }

  return (
    <>
      {labels.map((label: Label) => (
        <span className="label" style={getStyles(label)} title={label.description} key={label.id}>{label.name}</span>
      ))}
    </>
  )
}

export default Labels;