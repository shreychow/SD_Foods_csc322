import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [dishes, setDishes] = useState([])
  const [cart, setCart] = useState([])

  useEffect(() => {
    const stored = localStorage.getItem('customer')
    if (!stored) {
      navigate('/login')
      return
    }
    setCustomer(JSON.parse(stored))
    loadMenu()
  }, [])

  const loadMenu = async () => {
    const res = await client.get('/dishes/')
    setDishes(res.data)
  }

  const addToCart = (dish) => {
    setCart(prev => [...prev, dish])
  }

  return (
    <div>
      <h1>Welcome {customer?.username}</h1>
      <button onClick={() => navigate('/login')}>Logout</button>

      <h2>Menu</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {dishes.map(dish => (
          <div key={dish.dish_id} className="card" style={{ padding: "10px" }}>
            <h3>{dish.name}</h3>
            <p>${dish.price}</p>
            <button className="btn btn-primary" onClick={() => addToCart(dish)}>
              Add to cart
            </button>
          </div>
        ))}
      </div>

      <h2>Cart</h2>
      <ul>
        {cart.map((c, i) => <li key={i}>{c.name} - ${c.price}</li>)}
      </ul>
    </div>
  )
}
