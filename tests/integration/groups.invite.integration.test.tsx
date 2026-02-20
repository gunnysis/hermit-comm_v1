import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils';
import MyGroupsScreen from '@/app/groups';
import * as communityApi from '@/features/community/api/communityApi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/features/community/api/communityApi');
jest.mock('@/shared/hooks/useResponsiveLayout', () => ({
  useResponsiveLayout: () => ({
    isWide: false,
    isDesktop: false,
    contentWidth: 375,
  }),
}));

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return renderWithProviders(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe.skip('내 그룹 화면 - 초대 코드 참여', () => {
  const joinGroupByInviteCodeMock = communityApi.joinGroupByInviteCode as jest.MockedFunction<
    typeof communityApi.joinGroupByInviteCode
  >;
  const getMyGroupsMock = communityApi.getMyGroups as jest.MockedFunction<
    typeof communityApi.getMyGroups
  >;

  beforeEach(() => {
    joinGroupByInviteCodeMock.mockResolvedValue({
      group: { id: 1, name: '테스트 그룹', description: null },
      alreadyMember: false,
    });
    getMyGroupsMock.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('초대 코드 입력 UI가 렌더된다', () => {
    renderWithQueryClient(<MyGroupsScreen />);

    expect(screen.getByText('초대 코드로 참여')).toBeTruthy();
  });

  it('코드를 입력하지 않고 참여하기를 누르면 안내 알럿을 띄운다', async () => {
    renderWithQueryClient(<MyGroupsScreen />);

    const joinButton = screen.getByText('참여하기');
    fireEvent.press(joinButton);

    await waitFor(() => {
      expect(joinGroupByInviteCodeMock).not.toHaveBeenCalled();
    });
  });
});
