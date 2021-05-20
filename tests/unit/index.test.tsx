import HomePage from 'pages'
import * as React from 'react'
/*
jest.mock("@tippyjs/react", () => ({
    __esModule: true,
    default: jest.fn(),
  }));

  jest.mock('node_modules/@synthetixio/contracts-interface/node_modules/@ethersproject/signing-key', () => {
    return () => {};
});

jest.mock('node_modules/@ethersproject/signing-key', () => {
    return () => {};
});

jest.mock('react-query', () => {
    return () => {};
})

jest.mock('sections/shared/SystemStatus/SystemStatus.tsx', () => {
    return () => {};
})

jest.mock('@balancer-labs/sor', () => {
    return () => {};
})

jest.mock('sections/shared/Layout/Logo/Logo.tsx', () => {
    return () => {}
})
*/
import { render, RenderOptions } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect";

describe('Pages', () => {
  describe('Index', () => {
    it('should render without throwing an error', function () {
      render(<HomePage/>)
    })
  })  
})