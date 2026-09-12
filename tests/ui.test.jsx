// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import SegmentedControl from '../src/components/ui/SegmentedControl.jsx';
import Stepper from '../src/components/ui/Stepper.jsx';

afterEach(cleanup);

describe('SegmentedControl', () => {
  const options = [
    { value: 'a', label: 'First' },
    { value: 'b', label: 'Second' },
    { value: 'c', label: 'Third', disabled: true },
  ];

  it('marks the active option and fires onChange', () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        value="b"
        onChange={onChange}
        options={options}
        ariaLabel="Choices"
      />,
    );

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    expect(radios[0]).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(radios[0]);
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('respects disabled options', () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl value="a" onChange={onChange} options={options} />,
    );
    const third = screen.getAllByRole('radio')[2];
    expect(third).toBeDisabled();
    fireEvent.click(third);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Stepper', () => {
  const steps = [
    { id: 'one', label: 'Step one', hint: 'first' },
    { id: 'two', label: 'Step two', hint: 'second' },
    { id: 'three', label: 'Step three', hint: 'third' },
  ];

  it('allows jumping back to completed steps only', () => {
    const onJump = vi.fn();
    render(<Stepper steps={steps} current={1} onJump={onJump} />);

    const buttons = screen.getAllByRole('button');
    // Step one (index 0) is clickable, step three (index 2) is not
    expect(buttons[0]).not.toBeDisabled();
    expect(buttons[2]).toBeDisabled();

    fireEvent.click(buttons[0]);
    expect(onJump).toHaveBeenCalledWith(0);
  });
});
