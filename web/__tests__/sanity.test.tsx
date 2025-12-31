import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// We include this temporary test because Jest requires at least one test suite found.
describe('Web Module Sanity Check', () => {
  it('renders a heading', () => {
    render(<h1>NextDesk</h1>)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
  })
})
