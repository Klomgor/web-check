import Heading from 'client/components/Form/Heading';
import Nav from 'client/components/Form/Nav';
import colors from 'client/styles/colors';
import type { AddressType } from 'client/utils/address-type-checker';
import { toolName, type CategoryId } from '@/data/categories';
import { checks, type CheckId } from '@/data/checks';

interface Props {
  address: string;
  addressType: AddressType;
  category?: CategoryId;
  check?: CheckId;
}

const makeSiteName = (address: string): string => {
  try {
    const withScheme = /^https?:\/\//i.test(address) ? address : `https://${address}`;
    return new URL(withScheme).hostname.replace(/^www\./, '');
  } catch {
    return address;
  }
};

const makeTool = (category?: CategoryId, check?: CheckId) => {
  if (check) return { name: checks[check].title, href: `/${check}` };
  if (category) return { name: toolName(category), href: `/${category}` };
};

const ResultsHeader = ({ address, addressType, category, check }: Props): JSX.Element => (
  <Nav tool={makeTool(category, check)}>
    {address && (
      <Heading color={colors.textColor} size="medium">
        {addressType === 'url' && (
          <a
            target="_blank"
            rel="noreferrer"
            href={/^https?:\/\//i.test(address) ? address : `https://${address}`}
          >
            <img width="32px" alt="" src={`https://icon.horse/icon/${makeSiteName(address)}`} />
          </a>
        )}
        {makeSiteName(address)}
      </Heading>
    )}
  </Nav>
);

export default ResultsHeader;
