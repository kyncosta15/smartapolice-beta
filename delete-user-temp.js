// Script temporário para deletar usuário
const deleteUser = async () => {
  try {
    const response = await fetch('https://jhvbfvqhuemuvwgqpskz.supabase.co/functions/v1/delete-user-by-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email: 'rcaldas@rcaldas.com.br'
      })
    });

    const result = await response.json();
    console.log('Resultado:', result);
  } catch (error) {
    console.error('Erro:', error);
  }
};

deleteUser();