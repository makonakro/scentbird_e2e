import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('https://www.scentbird.com/gift?months=6');
});


test.describe('Gift subscription with filled required fields, non-logged user', () => {
  test.only('Send present with message later', async ({ page }) => {
    const currentDate = new Date();
    const tomorrowDate = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000));
    const formattedTomorrowDate = tomorrowDate.toISOString().split('T')[0];
    await page.getByTestId('recipientGenderOptionMale').click()
    await page.getByTestId('recipientName').fill('James')
    await page.getByTestId('recipientEmail').fill('presentforjames@test.com')
    await page.getByTestId('recipientMessage').fill('Enjoy!')
    await page.getByTestId('sendDateOptionLater').click()
    await page.getByTestId('checkoutNowButton').click()
    page.waitForResponse(
      (response) =>
        response.url().includes('https://api.scentbird.com/graphql?opname=CartModify') &&
        response.status() === 200 &&
        response.request().postDataJSON()[0]['data.cartModify.data.cart.giftSubscription.recipient.date'] === formattedTomorrowDate
    ),
    await expect(page.getByTitle('Create your account')).toBeVisible()
  });

  test('Send present without message now', async ({ page }) => {
    await page.getByTestId('recipientGenderOptionFemale').click()
    await page.getByTestId('recipientName').fill('Anna')
    await page.getByTestId('recipientEmail').fill('presentforanna@test.com')
    await page.getByTestId('sendDateOptionLater').click()
    await page.getByTestId('checkoutNowButton').click()
    await expect(page.getByTitle('Create your account')).toBeVisible()
  });
})

test.describe('Check page elements', () => {
  test('Check subscription description', async ({ page }) => {
    await expect(page.getByText('Ready to wrap it up?')).toBeVisible()
    await expect(page.getByText('6 month gift subscription ($89)')).toBeVisible()
    await expect(page.getByText("Input your friend's information below, and we'll send them an email after you complete your order to let them know you've given them a gift subscription.")).toBeVisible()
  });
});

  test.describe('Gift subscription with empty required fields, non-logged user', () => {
    test('Empty name field', async ({ page }) => {
      await page.getByTestId('recipientGenderOptionFemale').click()
      await page.getByTestId('recipientEmail').fill('presentforanna@test.com')
      await page.getByTestId('senderName').fill('James')
      await page.getByTestId('recipientMessage').fill('Enjoy!')
      await page.getByTestId('sendDateOptionNow').click()
      await page.getByTestId('checkoutNowButton').click()
      await expect(page.getByTestId('recipientNameError')).toContainText('Required')
    });

    test('Empty email field', async ({ page }) => {
      await page.getByTestId('recipientGenderOptionFemale').click()
      await page.getByTestId('senderName').fill('James')
      await page.getByTestId('sendDateOptionLater').click()
      await page.getByTestId('checkoutNowButton').click()
      await expect(page.getByTestId('recipientNameError')).toContainText('Required')
    });
  });

  test.describe('Form validation', () => {
    const names = [
      { name: '01'},
      { name: '+=!' },
      { name: ' '},
      { name: 'external description'},
    ];
    for (const name of names) {
    test('Name validation', async ({ page }) => {
      await page.getByTestId('recipientName').fill(`${name.name}`)
      await page.click('enter')
      await expect(page.getByText('recipientNameError')).toContainText('Required')
    });
    const emails = [
      { email: 'test'},
      { email: 'test@' },
      { email: 'test@email'},
      { email: '@email.com'},
      { email: '@.com'},
      { email: ' '},
    ];
    for (const email of emails) {
    test('Email validation', async ({ page }) => {
      await page.getByTestId('recipientEmail').fill(`${email.email}`)
      await page.click('enter')
      await expect(page.getByText('recipientEmailError')).toContainText('Valid email address required')
    });
  }
}
});