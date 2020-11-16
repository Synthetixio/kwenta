import { GetServerSideProps } from 'next';
import ipRangeCheck from 'ip-range-check';

export const defaultServerSideProps: GetServerSideProps = async (context) => {
	if (process.env.CF_IP) {
		const allowedIps = JSON.parse(`[${process.env.CF_IP}]`);
		const ip = context.req.headers['x-forwarded-for'] || context.req.connection.remoteAddress;
		if (typeof ip === 'string' && !ipRangeCheck(ip, allowedIps)) {
			context.res.statusCode = 403;
			context.res.end('Your IP is not whitelisted.');
			return { props: {} };
		} else {
			const props = await getProps();
			return props;
		}
	} else {
		const props = await getProps();
		return props;
	}
	async function getProps() {
		return {
			props: {},
		};
	}
};
