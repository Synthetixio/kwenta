import React, { FC } from 'react';

import Connector from './Connector';
import Etherscan from './Etherscan';
import Notify from './Notify';
import OneInch from './OneInch';
import L2Gas from './L2Gas';

type WithAppContainersProps = {
	children: React.ReactNode;
};

export const WithAppContainers: FC<WithAppContainersProps> = ({ children }) => (
	<Connector.Provider>
		<Etherscan.Provider>
			<OneInch.Provider>
				<Notify.Provider>
					<L2Gas.Provider>{children}</L2Gas.Provider>
				</Notify.Provider>
			</OneInch.Provider>
		</Etherscan.Provider>
	</Connector.Provider>
);

export default WithAppContainers;
