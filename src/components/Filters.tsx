import React, { FC } from 'react'
import "./Filters.scss";

interface FiltersProps {
  state: string;
  limit: number;
  labels?: string;
  filterUpdater: Function
}

const Filters: FC<FiltersProps> = (props) => {
  const { state, limit, labels, filterUpdater } = props;

  function handleChange(filter: any) {
    filterUpdater({ ...props, ...filter })
  }
  return (
    <fieldset>
      <legend>Filters</legend>
      <div className="filters-container">
        <div>
          <label htmlFor="state">State</label>
          <select
            value={state}
            id="state"
            className="form-control"
            onChange={(event => handleChange({ state: event.target.value }))}
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div>
          <label htmlFor="limit">Limit</label>
          <input className="form-control" value={limit} onChange={(event => handleChange({ limit: event.target.value }))} id="limit" type="number" min="1" />
        </div>

        <div>
          <label htmlFor="labels">Labels</label>
          <input className="form-control" value={labels} onChange={(event => handleChange({ labels: event.target.value }))} id="labels" />
        </div>
      </div>
    </fieldset>
  )
}

export default Filters;