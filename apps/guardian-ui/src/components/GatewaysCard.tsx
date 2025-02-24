import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Flex,
  Link,
  Text,
  useTheme,
} from '@chakra-ui/react';
import { ConfigResponse, Gateway } from '../types';
import { Table, TableColumn, TableRow } from '@fedimint/ui';
import { useTranslation, formatEllipsized } from '@fedimint/utils';
import { useAdminContext } from '../hooks';
import { LightningModuleRpc } from '../GuardianApi';

type TableKey = 'nodeId' | 'gatewayId' | 'fee';

interface GatewaysCardProps {
  config: ConfigResponse | undefined;
}

export const GatewaysCard: React.FC<GatewaysCardProps> = ({ config }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { api } = useAdminContext();
  const [gateways, setGateways] = useState<Gateway[]>([]);

  const lnModuleId = config
    ? Object.entries(config.client_config.modules).find(
        (m) => m[1].kind === 'ln'
      )?.[0]
    : undefined;

  useEffect(() => {
    if (!lnModuleId) return;
    api
      .moduleApiCall<{ info: Gateway }[]>(
        Number(lnModuleId),
        LightningModuleRpc.listGateways
      )
      .then((gateways) => setGateways(gateways.map((g) => g.info)))
      .catch(console.error);
  }, [config, api, lnModuleId]);

  const columns: TableColumn<TableKey>[] = useMemo(
    () => [
      {
        key: 'nodeId',
        heading: t('federation-dashboard.gateways.node-id-label'),
      },
      {
        key: 'gatewayId',
        heading: t('federation-dashboard.gateways.gateway-id-label'),
      },
      {
        key: 'fee',
        heading: t('federation-dashboard.gateways.fee-label'),
      },
    ],
    [t]
  );

  const rows: TableRow<TableKey>[] = useMemo(
    () =>
      gateways.map(({ gateway_id, node_pub_key, fees }) => {
        const feePct = fees.proportional_millionths / 10000;
        const fee = [
          fees.base_msat ? `${fees.base_msat / 1000} sats +` : '',
          `${fees.proportional_millionths} ppm`,
          feePct ? `(${feePct}%)` : '',
        ]
          .filter(Boolean)
          .join(' ');
        return {
          key: gateway_id,
          nodeId: (
            <Flex direction='column' gap='4px'>
              <Text>{formatEllipsized(node_pub_key)}</Text>
              <Text size='xs'>
                <Link
                  color={theme.colors.blue[600]}
                  href={`https://amboss.space/node/${node_pub_key}`}
                  target='_blank'
                  rel='noreferrer'
                >
                  {t('federation-dashboard.gateways.view-on-site', {
                    site: 'amboss.space',
                  })}
                </Link>
              </Text>
            </Flex>
          ),
          gatewayId: formatEllipsized(gateway_id),
          fee: fee,
          outgoingFee: fee,
        };
      }),
    [gateways, t, theme]
  );

  return (
    <Card>
      <CardHeader>
        <Text size='lg' fontWeight='600'>
          {t('federation-dashboard.gateways.label')}
        </Text>
      </CardHeader>
      <CardBody>
        <Table columns={columns} rows={rows} />
      </CardBody>
    </Card>
  );
};
