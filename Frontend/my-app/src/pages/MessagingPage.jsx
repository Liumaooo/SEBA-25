import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; 
import "./MessagingPage.css";
import axios from "axios";
import ShelterBadge from "../components/ShelterBadge";
import CatProfileModal from "../components/CatProfileModal";
import SellerUpgradeModal from "../components/SellerUpgradeModal";
import UpgradeModal from "../components/UpgradeModal";
import { useSellerSubscription } from "../hooks/useSellerSubscription";
import { useBuyerSubscription } from "../hooks/useBuyerSubscription";
import { useNavigate } from "react-router-dom";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { IconButton } from "@mui/material";

// 星星评分控件
function StarRating({ value, onChange, disabled }) {
  return (
    <div style={{ fontSize: '1.7rem', color: '#f1cf60', cursor: disabled ? 'default' : 'pointer', userSelect: 'none' }}>
      {Array(5).fill(0).map((_, i) => (
        <span
          key={i}
          style={{ color: i < value ? '#f1cf60' : '#e4e2d7', marginRight: 3, fontSize: '1.6rem' }}
          onClick={() => !disabled && onChange(i + 1)}
          role="button"
        >★</span>
      ))}
    </div>
  );
}

export default function MessagingPage() {
  // All hooks at the top
  const { chatId } = useParams();
  const [chatList, setChatList] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [messageList, setMessageList] = useState([]);
  const [showCatModal, setShowCatModal] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));
  const myUserId = user?.id;
  const userType = user?.userType;
  const { canAccessMessages } = useSellerSubscription();
  const { canContactSellers } = useBuyerSubscription();
  const subscriptionExpired = (userType === 'seller' && !canAccessMessages()) || (userType === 'buyer' && !canContactSellers());
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false); // 新增状态，防止重复提交
  const token = localStorage.getItem('token');

  // All useEffect hooks here
  useEffect(() => {
    async function fetchChats() {
      const token = localStorage.getItem('token');
      const res = await axios.get('/chats', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setChatList(res.data);
      if (chatId) {
        setActiveChatId(chatId);
      } else if (res.data.length > 0) {
        setActiveChatId(res.data[0]._id);
      }
    }
    fetchChats();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    let id = chatId || activeChatId;
    if (!id) return;
    async function fetchMessages() {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/messages/${id}`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      setMessageList(res.data);
    }
    fetchMessages();
  }, [chatId, activeChatId]);

  // Only now do permission checks and early returns
  if (userType === 'seller' && !canAccessMessages()) {
    return (
      <div className="messaging-page" style={{ padding: 40, textAlign: 'center' }}>
        <h2>Access Restricted</h2>
        <p>You need a paid seller subscription to access messages.</p>
        <SellerUpgradeModal
          open={true}
          onClose={() => {}}
          title="Upgrade Required"
          message="You need a paid seller subscription to access messages. Please upgrade to continue."
        />
      </div>
    );
  }
  if (userType === 'buyer' && !canContactSellers()) {
    return (
      <div className="messaging-page" style={{ padding: 40, textAlign: 'center' }}>
        <h2>Access Restricted</h2>
        <p>You need a paid buyer subscription to access messages.</p>
        <UpgradeModal
          open={true}
          onClose={() => {}}
          title="Upgrade Required"
          message="You need a paid buyer subscription to access messaging features. Please upgrade to continue."
        />
      </div>
    );
  }
  if (chatList.length === 0) {
    return <div style={{ padding: 40, marginTop: "100px", textAlign: 'center', color: '#999' }}>No chats yet. Start a conversation!</div>;
  }

  const normalizeId = (id) => (typeof id === "object" && id._id) ? id._id : id;
  const activeChat = chatList.find(chat => chat._id === activeChatId);
  const isBuyer = normalizeId(activeChat?.buyerId) === myUserId;
  const isSeller = normalizeId(activeChat?.sellerId) === myUserId;

  const isCompleted = activeChat?.status === 'completed';

  const adoptionCompleted = activeChat?.status === 'completed';
  const reviewMsg = messageList.find(m => m.type === 'review');
  const hasReview = !!reviewMsg;

  // ✅ handleUpdateStatus
  const handleUpdateStatus = () => {
    if (!isCompleted) {
      setShowConfirmDialog(true);
    }
  };

const confirmAdoption = async () => {
  if (confirming) return;
  setConfirming(true);
  setShowConfirmDialog(false);

  const token = localStorage.getItem('token');
  const chatData = chatList.find(chat => chat._id === activeChatId);

  try {
    // 1️⃣ 更新 Chat 状态
    await axios.put(`/chats/${activeChatId}/status`, { status: 'completed' }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // 2️⃣ 确认 Adoption 是否已存在
    let adoptionId = chatData?.adoptionId; // 如果聊天里有adoptionId，可以直接用
    if (!adoptionId && chatData?.catId?._id && chatData?.buyerId?._id) {
      // 没有则创建 adoption
      const res = await axios.post(`/adoptions`, {
        catId: chatData.catId._id,
        buyerId: chatData.buyerId._id,
        messageFromBuyer: "Confirmed via chat"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      adoptionId = res.data._id; // 取新建的 adoption ID
    }

    // 3️⃣ 更新 Adoption 状态为 completed
    if (adoptionId) {
      await axios.put(`/adoptions/${adoptionId}/status`, {
        status: "completed"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("✅ Adoption marked as completed");
    }

    // ✅ 更新 UI
    setChatList(prev => prev.map(chat =>
      chat._id === activeChatId ? { ...chat, status: 'completed' } : chat
    ));
    setMessageList(prev => [
      ...prev,
      { id: Date.now(), type: "system", text: "Adoption completed" }
    ]);

  } catch (err) {
    console.error("❌ Failed to confirm adoption:", err);
  } finally {
    setConfirming(false);
  }
};


    // ✅ 关闭弹窗
    const cancelAdoption = () => {
      setShowConfirmDialog(false);
    };


const handleReview = async (star) => {

  console.log("handleReview triggered with star:", star);
console.log("activeChatId:", activeChatId);

  if (!activeChat || !activeChat.sellerId) return;
  const token = localStorage.getItem('token');
  try {
    // 1. 更新卖家评分
    await axios.post(
      `/users/seller/${activeChat.sellerId._id}/rating`,
      { rating: star },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // 2. 创建 review 消息
    await axios.post(`/messages/${activeChatId}`, {
      text: "You rated the seller",
      type: "review",
      stars: star
    }, { headers: { Authorization: `Bearer ${token}` } });

    // 3. 标记聊天已评分
    await axios.put(`/chats/${activeChatId}/mark-rated`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // 4. 刷新消息列表（保证和数据库同步）
    const res = await axios.get(`/messages/${activeChatId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setMessageList(res.data);

    // 5. 更新 chatList 以隐藏评分UI
    setChatList(prev => prev.map(chat =>
      chat._id === activeChatId ? { ...chat, buyerHasRated: true } : chat
    ));

    alert("Thanks for your rating!");
  } catch (err) {
    console.error("❌ Failed to submit rating:", err);
  }
};


    const sendMessage = async () => {
if (!input.trim() || !activeChatId || !activeChat) return;


  if ((userType === 'seller' && !canAccessMessages()) || (userType === 'buyer' && !canContactSellers())) {
    setUpgradeModalOpen(true);
    return;
  }

  const token = localStorage.getItem('token');
  try {
    // ✅ 发送消息
    await axios.post(`/messages/${activeChatId}`, 
      { text: input, type: "user" }, 
      { headers: { Authorization: 'Bearer ' + token } }
    );

    setInput("");

    // ✅ 刷新消息列表
    const res = await axios.get(`/messages/${activeChatId}`, {
      headers: { Authorization: 'Bearer ' + token }
    });
    setMessageList(res.data);
  } catch (err) {
    console.error("❌ Failed to send message:", err);
  }
};


  const BACKEND_URL = "http://localhost:8080";
  const getImageUrl = (url) => url?.startsWith("http") ? url : BACKEND_URL + url;

  const handleDeleteChat = async (chatId) => {
    if (!window.confirm('Are you sure you want to delete this chat?')) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setChatList(prev => {
        const newList = prev.filter(chat => chat._id !== chatId);
        if (activeChatId === chatId) {
          setActiveChatId(newList.length > 0 ? newList[0]._id : null);
          setMessageList([]);
        }
        return newList;
      });
    } catch (error) {
      console.error('❌ Failed to delete chat:', error);
      alert('Failed to delete chat.');
    }
  };


  return (
    <div className="messaging-page">
      <div className="chat-main">
        {/* 多会话侧边栏 */}
        <aside className="chat-sidebar">
          {chatList.map(chat => (
            <div
              key={chat._id}
              className={`cat-profile-card${chat._id === activeChatId ? " active" : ""}`}
              onClick={() => {
                setActiveChatId(chat._id);
                setMessageList([]);
              }}
              style={{ cursor: "pointer", position: "relative" }}
            >
<img
  src={getImageUrl(chat.catId?.photoUrl || chat.catSnapshot?.photoUrl || '/default-cat.png')}
  alt={chat.catId?.name || chat.catSnapshot?.name || 'No Name'}
  className="cat-profile-img"
/>
<div className="cat-profile-info">
  <span className="cat-profile-name">
    <b>{chat.catId?.name || chat.catSnapshot?.name || 'Unknown'}</b>
    {` (${(chat.catId?.sex || chat.catSnapshot?.sex) === "f" ? "♀" : "♂"})`}
  </span>
  <span className="cat-profile-meta">
  {chat.catId?.ageYears || chat.catSnapshot?.ageYears
    ? `${chat.catId?.ageYears || chat.catSnapshot?.ageYears} year${(chat.catId?.ageYears || chat.catSnapshot?.ageYears) > 1 ? 's' : ''}`
    : '-'}
  { (chat.catId?.location || chat.catSnapshot?.location)
    ? ` | ${chat.catId?.location || chat.catSnapshot?.location}`
    : ''}
</span>

</div>

      {/* delete button */}
      <IconButton
        className="delete-chat-btn"
        size="small"
        sx={{
          bgcolor: "rgba(255,255,255,0.9)",
          position: "absolute",
          bottom: 8,
          right: 8,
          zIndex: 2,
          "&:hover": { bgcolor: "#ffebee" }
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteChat(chat._id);
        }}
        aria-label="Delete chat"
      >
        <DeleteRoundedIcon fontSize="medium" />
      </IconButton>

            </div>
          ))}
          {chatList.length === 0 && (
            <div className="chat-other-chats">No chats.</div>
          )}
        </aside>
        {/* 右侧聊天区 */}
      <section className="chat-area">
  {!activeChat ? (
    <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
      Select a chat to view messages
    </div>
  ) : (
    <>
      <div className="chat-header">
        <div className="chat-header-left">
          <img
            src={
              isBuyer
                ? getImageUrl(activeChat.sellerId?.avatar)
                : getImageUrl(activeChat.buyerId?.avatar)
            }
            alt={
              isBuyer
                ? activeChat.sellerId?.name
                : activeChat.buyerId?.name
            }
            className="seller-avatar"
            onClick={() => {
              if (isBuyer && activeChat?.sellerId?._id) {
                navigate(`/sellerpub/${activeChat.sellerId._id}`);
              }
            }}
            style={{ cursor: isBuyer ? "pointer" : "default" }}
          />
          <div className="seller-info">
            <span className="seller-name">
              {isBuyer
                ? activeChat.sellerId?.name
                : activeChat.buyerId?.name}
            </span>
            {isBuyer && activeChat.sellerId?._id && (
              <ShelterBadge sellerId={activeChat.sellerId._id} size="small" />
            )}
          </div>
        </div>
        {isSeller && (
          <button className="btn-update-status" onClick={handleUpdateStatus} disabled={isCompleted}>
            {isCompleted ? "Completed" : "Update Status"}
          </button>
        )}
      </div>

      <div className="chat-body">
        {messageList.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
            No messages yet. Start the conversation!
          </div>
        )}
        {messageList.map((msg) => {
          const user = JSON.parse(localStorage.getItem('user') || "{}");
          const isMe = msg.senderId === user?.id;

          if (msg.type === "system") {
            return (
              <div key={msg.id} className="chat-system-msg">
                {msg.text}
              </div>
            );
          } else if (msg.type === "review") {
            return (
              <div key={msg.id} className="chat-msg chat-msg-review">
                <div className="chat-msg-stars">
                  {Array(5).fill(0).map((_, i) =>
                    <span key={i} className={i < msg.stars ? "star-filled" : "star"}>★</span>
                  )}
                </div>
                <div className="chat-msg-content">You rated the seller</div>
              </div>
            );
          } else {
            return (
              <div key={msg.id} className={`chat-msg ${isMe ? "chat-msg-user" : "chat-msg-seller"}`}>
                <div className="chat-msg-content">{msg.text}</div>
                <div className="chat-msg-time">{msg.time}</div>
              </div>
            );
          }
        })}
      </div>

      {(adoptionCompleted || subscriptionExpired) && (
        <div className="system-message" style={{ textAlign: 'center', padding: '10px', color: '#b00' }}>
          {adoptionCompleted ? "This adoption has been completed." :
            (!canAccessMessages() ? "Seller's subscription has expired." : "Buyer's subscription has expired.")}
        </div>
      )}

      {isBuyer && isCompleted && !activeChat?.buyerHasRated && (
        <div className="chat-review-box">
          <div style={{ marginBottom: 6 }}>Please leave me a review:</div>
          <StarRating
            value={0}
            onChange={handleReview}
            disabled={false}
          />
        </div>
      )}

      {!adoptionCompleted && !subscriptionExpired && (
        <div className="chat-input-row">
          <input
            className="chat-input"
            type="text"
            placeholder="Type message"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
          />
          <button className="chat-send-btn" onClick={sendMessage}>➤</button>
        </div>
      )}
    </>
  )}
</section>

      </div>
      {showConfirmDialog && (
        <div className="confirm-dialog-overlay" onClick={() => setShowConfirmDialog(false)}>
          <div className="confirm-dialog-content" onClick={e => e.stopPropagation()}>
            <button className="confirm-dialog-close" onClick={() => setShowConfirmDialog(false)}>×</button>
            <h3>Confirm Adoption</h3>
            <p>Are you sure you want to mark this adoption as <strong>completed</strong>?</p>
            <div className="confirm-actions">
              <button
                  className="confirm-btn confirm"
                  onClick={confirmAdoption}
                  disabled={confirming}
                >
                  {confirming ? "Confirming..." : "Yes, confirm"}
                </button>

              <button className="confirm-btn cancel" onClick={() => setShowConfirmDialog(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showCatModal && activeChat?.catId && (
        <CatProfileModal
          cat={{
            ...activeChat.catId,
            sellerId: activeChat.sellerId?._id,
            sellerName: activeChat.sellerId?.name
          }}
          onClose={() => setShowCatModal(false)}
        />
      )}
      {/* Seller Upgrade Modal for sellers, UpgradeModal for buyers */}
      <SellerUpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title="Access Restricted"
        message="You need a paid seller subscription to access messaging features. Please upgrade to continue."
      />
      <UpgradeModal
        open={userType === 'buyer' && upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title="Upgrade Required"
        message="You need a paid buyer subscription to access messaging features. Please upgrade to continue."
      />

    </div>
  );
}
